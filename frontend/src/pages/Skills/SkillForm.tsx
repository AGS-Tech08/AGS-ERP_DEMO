import { useState } from 'react';
import type { FormEvent } from 'react';
import { skillService } from '../../services/skillService';
export default function SkillForm() { const [skillName, setSkillName] = useState(''); const submit = async (e: FormEvent) => { e.preventDefault(); await skillService.create({ skill_name: skillName, status: 'Active' }); setSkillName(''); }; return <form onSubmit={submit} className="max-w-xl rounded bg-white p-6 shadow"><h1 className="mb-3 text-2xl font-bold">Add Skill</h1><input required className="w-full rounded border p-2" value={skillName} onChange={e => setSkillName(e.target.value)} placeholder="Skill name" /><button className="mt-3 rounded bg-blue-600 px-4 py-2 text-white">Save Skill</button></form>; }
