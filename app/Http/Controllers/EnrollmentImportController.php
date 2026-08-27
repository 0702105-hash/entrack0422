<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use App\Models\Enrollment;
use App\Models\Program;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Artisan;
use PhpOffice\PhpSpreadsheet\IOFactory;

class EnrollmentImportController extends Controller
{
    private const SEMESTER_SECTIONS = [
        'FIRST SEMESTER' => 'First',
        '1ST SEMESTER' => 'First',
        'SECOND SEMESTER' => 'Second',
        '2ND SEMESTER' => 'Second',
        'SUMMER' => 'Summer',
        'SUMMER SEMESTER' => 'Summer',
    ];

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv,txt|max:10240',
        ]);

        $file = $request->file('file');
        $extension = strtolower($file->getClientOriginalExtension());

        try {
            $parsed = in_array($extension, ['xlsx', 'xls'])
                ? $this->parseExcel($file)
                : $this->parseCsv($file);
        } catch (\Throwable $e) {
            Log::error('Import parse error: ' . $e->getMessage());
            return redirect()->back()->withErrors([
                'file' => 'Could not read this file: ' . $e->getMessage(),
            ]);
        }

        [$rows, $parseWarnings] = $parsed;

        if (empty($rows)) {
            return redirect()->back()->withErrors([
                'file' => 'No usable enrollment rows were found in this file.'
                    . (!empty($parseWarnings) ? ' ' . implode(' ', array_slice($parseWarnings, 0, 3)) : ''),
            ]);
        }

        // Look up every program once, normalized (trimmed, whitespace-collapsed,
        // uppercased), instead of a per-row LIKE query. The old importer's
        // per-row `LIKE $programName` (no wildcards) query happened to work
        // for this dataset because MySQL ignores trailing padding in string
        // comparisons by default -- but that's a MySQL-specific quirk, not a
        // guarantee, and it did nothing for internal double-spacing or a
        // future database engine. Normalizing explicitly in PHP is correct
        // regardless of collation.
        $programsByNormalizedName = Program::all()
            ->keyBy(fn ($p) => $this->normalizeName($p->program_name));

        $imported = 0;
        $updated = 0;
        $skipped = [];

        DB::beginTransaction();

        try {
            foreach ($rows as $row) {
                $key = $this->normalizeName($row['program_name']);
                $program = $programsByNormalizedName->get($key);

                if (!$program) {
                    $skipped[] = sprintf(
                        "AY %d-%d %s: program '%s' not found in the Programs table.",
                        $row['academic_year_start'],
                        $row['academic_year_end'],
                        $row['semester'],
                        $row['program_name']
                    );
                    continue;
                }

                $existed = Enrollment::where([
                    'program_id' => $program->getKey(),
                    'academic_year_start' => $row['academic_year_start'],
                    'academic_year_end' => $row['academic_year_end'],
                    'semester' => $row['semester'],
                ])->exists();

                Enrollment::updateOrCreate(
                    [
                        'program_id' => $program->getKey(),
                        'academic_year_start' => $row['academic_year_start'],
                        'academic_year_end' => $row['academic_year_end'],
                        'semester' => $row['semester'],
                    ],
                    [
                        'male' => $row['male'],
                        'female' => $row['female'],
                    ]
                );

                $existed ? $updated++ : $imported++;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Import Error: ' . $e->getMessage());
            return redirect()->back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }

        // Trigger the ML pipeline to retrain and reseed predictions using the
        // same `ml:retrain` Artisan command the Retrain button uses.
        $exitCode = Artisan::call('ml:retrain', [
            '--base-year' => (int) date('Y'),
            '--future-years' => 1,
        ]);

        $message = "Imported {$imported} new and updated {$updated} existing enrollment records.";

        if (!empty($skipped)) {
            $message .= ' ' . count($skipped) . ' row(s) skipped: ' . implode(' | ', array_slice($skipped, 0, 5));
            if (count($skipped) > 5) {
                $message .= ' (+' . (count($skipped) - 5) . ' more, see logs)';
            }
            foreach ($skipped as $line) {
                Log::warning('Import skipped: ' . $line);
            }
        }

        if ($exitCode !== 0) {
            $output = Artisan::output();
            Log::error('ML pipeline failed after import: ' . $output);
            $message .= ' Warning: prediction retrain failed — ' . substr($output, -300);
        } else {
            $message .= ' Predictions updated.';
        }

        return redirect()->back()->with('success', $message);
    }

    /**
     * Parses the real registrar export format: one worksheet per academic
     * year (e.g. sheet titled "2015-2016"), and within each sheet, up to
     * three stacked mini-tables -- one per semester -- each introduced by a
     * section header row ("FIRST SEMESTER" / "SECOND SEMESTER" / "SUMMER"),
     * followed by a "PROGRAM | TOTAL | MALE | FEMALE" header row, then the
     * program data rows themselves. Not every sheet has all three sections
     * (e.g. no Summer term some years, or a term that hasn't happened yet
     * for the current academic year) -- that's expected, not an error.
     *
     * @return array{0: array<int, array{program_name:string,academic_year_start:int,academic_year_end:int,semester:string,male:int,female:int}>, 1: array<int,string>}
     */
    private function parseExcel(UploadedFile $file): array
    {
        $spreadsheet = IOFactory::load($file->getRealPath());
        $rows = [];
        $warnings = [];

        foreach ($spreadsheet->getAllSheets() as $sheet) {
            $sheetTitle = trim($sheet->getTitle());
            [$ayStart, $ayEnd] = $this->parseAcademicYear($sheetTitle);

            if ($ayStart === null) {
                // Sheet name didn't look like "2015-2016" -- try to recover
                // the year from an "ENROLLMENT DATA A.Y. 2015-2016" title
                // cell inside the sheet before giving up on it entirely.
                $titleCellText = (string) ($sheet->getCell('A2')->getValue() ?? '');
                [$ayStart, $ayEnd] = $this->parseAcademicYear($titleCellText);
            }

            if ($ayStart === null) {
                $warnings[] = "Sheet '{$sheetTitle}': could not determine the academic year, skipped.";
                continue;
            }

            $currentSemester = null;
            $highestRow = $sheet->getHighestRow();

            // toArray() reads positionally by column (A=0, B=1, C=2, D=3)
            // and fills gaps with null, regardless of which cells were
            // actually "written" when the file was created. A manual
            // getRowIterator()/getCellIterator() walk can silently skip
            // never-written cells and shift columns out of alignment --
            // toArray() avoids that class of bug entirely.
            $sheetArray = $sheet->toArray(null, true, false, false);

            for ($r = 1; $r <= $highestRow; $r++) {
                $cells = $sheetArray[$r - 1] ?? [];
                while (count($cells) < 4) {
                    $cells[] = null;
                }

                $colA = is_string($cells[0]) ? trim($cells[0]) : trim((string) ($cells[0] ?? ''));
                $colAUpper = strtoupper($colA);

                if ($colA === '') {
                    continue;
                }

                if (isset(self::SEMESTER_SECTIONS[$colAUpper])) {
                    $currentSemester = self::SEMESTER_SECTIONS[$colAUpper];
                    continue;
                }

                if ($colAUpper === 'PROGRAM') {
                    continue; // the "PROGRAM | TOTAL | MALE | FEMALE" sub-header row
                }

                if (str_contains($colAUpper, 'COLLEGE') || str_contains($colAUpper, 'ENROLLMENT DATA')) {
                    continue; // sheet title rows
                }

                if ($currentSemester === null) {
                    continue; // stray text above the first section header
                }

                if (!is_numeric($cells[2]) && !is_numeric($cells[3])) {
                    // A program name row always has numeric MALE/FEMALE cells.
                    // If neither is numeric, this isn't a data row (blank
                    // spacer row, stray note, etc.) -- skip quietly.
                    continue;
                }

                $rows[] = [
                    'program_name' => $colA,
                    'academic_year_start' => $ayStart,
                    'academic_year_end' => $ayEnd,
                    'semester' => $currentSemester,
                    'male' => (int) ($cells[2] ?? 0),
                    'female' => (int) ($cells[3] ?? 0),
                ];
            }
        }

        return [$rows, $warnings];
    }

    /**
     * Original flat-CSV format, kept for anyone with a hand-built file:
     * no header row, columns are AY Start, AY End, Semester, Program, Male, Female.
     */
    private function parseCsv(UploadedFile $file): array
    {
        $fileData = array_map('str_getcsv', file($file->getRealPath()));
        array_shift($fileData); // header row

        $rows = [];
        $warnings = [];

        foreach ($fileData as $index => $row) {
            if (count($row) < 6) {
                $warnings[] = "CSV row {$index}: expected 6 columns, got " . count($row) . ", skipped.";
                continue;
            }

            $rows[] = [
                'program_name' => trim($row[3]),
                'academic_year_start' => (int) trim($row[0]),
                'academic_year_end' => (int) trim($row[1]),
                'semester' => trim($row[2]),
                'male' => (int) $row[4],
                'female' => (int) $row[5],
            ];
        }

        return [$rows, $warnings];
    }

    /**
     * "2015-2016" -> [2015, 2016]. Also matches text embedded in a longer
     * string, e.g. "ENROLLMENT DATA A.Y. 2015-2016".
     */
    private function parseAcademicYear(string $text): array
    {
        if (preg_match('/(\d{4})\s*-\s*(\d{4})/', $text, $m)) {
            return [(int) $m[1], (int) $m[2]];
        }

        return [null, null];
    }

    private function normalizeName(string $name): string
    {
        return strtoupper(trim(preg_replace('/\s+/', ' ', $name)));
    }
}
