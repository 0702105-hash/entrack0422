import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import PublicLayout from '@/layouts/PublicLayout';
import Sidebar from '@/components/dashboard/Sidebar';
import { Pencil, Trash2, Plus } from 'lucide-react';

type Program = {
  program_id: number;
  program_name: string;
  department_id?: number | null;
  department_name?: string | null;
};

type Props = {
  programs: Program[];
};

export default function ProgramsManage({ programs }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [programName, setProgramName] = useState('');
  const [editProgram, setEditProgram] = useState<Program | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    if (!programName.trim()) return;

    router.post(
      '/programs',
      { program_name: programName },
      {
        onSuccess: () => {
          setShowCreate(false);
          setProgramName('');
        },
      }
    );
  };

  const openEdit = (program: Program) => {
    setEditProgram(program);
    setEditName(program.program_name);
    setShowEdit(true);
  };

  const handleEdit = () => {
    if (!editProgram || !editName.trim()) return;

    router.put(`/programs/${editProgram.program_id}`, { program_name: editName }, {
      onSuccess: () => {
        setShowEdit(false);
        setEditProgram(null);
        setEditName('');
      },
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm('Delete this program?')) return;
    router.delete(`/programs/${id}`);
  };

  return (
    <>
      <Head title="Manage Programs" />

      <PublicLayout>
        <div className="flex gap-4 md:gap-6">
          <Sidebar />

          <main className="min-w-0 flex-1">
            <div className="mt-6 flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Manage Programs
                  </h2>
                  <p className="text-sm text-slate-500">
                    Create, edit, or remove academic programs.
                  </p>
                </div>

                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  Create Program
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-slate-500">
                        <th className="pb-2 pr-3">Program</th>
                        <th className="pb-2 pr-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {programs.map((program) => (
                        <tr key={program.program_id} className="border-t border-slate-100">
                          <td className="py-3 pr-3 font-medium text-slate-700">
                            {program.program_name}
                          </td>
                          <td className="py-3 pr-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openEdit(program)}
                                className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-600"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(program.program_id)}
                                className="inline-flex items-center gap-1 text-slate-600 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {programs.length === 0 && (
                        <tr>
                          <td colSpan={2} className="py-6 text-center text-slate-500">
                            No programs found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-2 text-lg font-semibold text-slate-800">Create Program</h3>
              <p className="mb-4 text-sm text-slate-500">Enter the program name.</p>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Program Name
                </label>
                <input
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  placeholder="e.g. BSIT"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEdit && editProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-2 text-lg font-semibold text-slate-800">Edit Program</h3>
              <p className="mb-4 text-sm text-slate-500">Update the program name.</p>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Program Name
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowEdit(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </PublicLayout>
    </>
  );
}

ProgramsManage.layout = (page: React.ReactNode) => <>{page}</>;