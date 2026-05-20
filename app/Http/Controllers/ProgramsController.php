<?php

namespace App\Http\Controllers;

use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProgramsController extends Controller
{
    public function index()
    {
        $userDeptId = auth()->user()?->department_id;

        $programTrends = Program::query()
            ->select('program_id', 'program_name')
            ->when($userDeptId, fn ($q) => $q->where('department_id', $userDeptId)) // ✅ scoped only if user has dept
            ->orderBy('program_name')
            ->get()
            ->map(fn ($p) => [
                'program_id' => $p->program_id,
                'program_name' => $p->program_name,
                'trend' => [],
            ]);

        return Inertia::render('Programs', [
            'filters' => [
                'model' => request('model', 'Ensemble'),
            ],
            'mainTrend' => [],
            'programTrends' => $programTrends,
        ]);
    }

    public function manage()
    {
        $userDeptId = auth()->user()?->department_id;

        $programs = Program::query()
            ->leftJoin('departments', 'departments.department_id', '=', 'programs.department_id')
            ->select([
                'programs.program_id',
                'programs.program_name',
                'programs.department_id',
                'departments.department_name',
            ])
            ->when($userDeptId, fn ($q) => $q->where('programs.department_id', $userDeptId)) // ✅ admin sees all
            ->orderBy('programs.program_name')
            ->get();

        return Inertia::render('ProgramsManage', [
            'programs' => $programs,
        ]);
    }

    public function store(Request $request)
    {
        $userDeptId = auth()->user()?->department_id;

        $data = $request->validate([
            'program_name' => ['required', 'string', 'max:255', 'unique:programs,program_name'],
        ]);

        // ✅ admin (no dept) must choose? For now, allow null department_id
        Program::create([
            'program_name' => $data['program_name'],
            'department_id' => $userDeptId, // null = admin‑created (global)
        ]);

        return redirect()->route('programs.manage')
            ->with('success', 'Program created.');
    }

    public function update(Request $request, Program $program)
    {
        $userDeptId = auth()->user()?->department_id;

        // ✅ allow admin (null dept) OR same department
        if ($userDeptId && $program->department_id !== $userDeptId) {
            abort(403);
        }

        $data = $request->validate([
            'program_name' => ['required', 'string', 'max:255', 'unique:programs,program_name,' . $program->program_id . ',program_id'],
        ]);

        $program->update([
            'program_name' => $data['program_name'],
        ]);

        return redirect()->route('programs.manage')
            ->with('success', 'Program updated.');
    }

    public function destroy(Program $program)
    {
        $userDeptId = auth()->user()?->department_id;

        // ✅ allow admin (null dept) OR same department
        if ($userDeptId && $program->department_id !== $userDeptId) {
            abort(403);
        }

        $program->delete();

        return redirect()->route('programs.manage')
            ->with('success', 'Program deleted.');
    }
}