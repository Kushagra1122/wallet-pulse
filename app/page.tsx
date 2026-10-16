"use client";

import { FormEvent, useState } from "react";

type CreatedPass = { id: string; saveUrl: string; value: number; mode: "google" | "mock" };

export default function Home() {
  const [name, setName] = useState("Alex Morgan");
  const [label, setLabel] = useState("Balance");
  const [value, setValue] = useState("40");
  const [nextValue, setNextValue] = useState("55");
  const [pass, setPass] = useState<CreatedPass | null>(null);
  const [state, setState] = useState<"idle" | "creating" | "updating">("idle");
  const [message, setMessage] = useState("Ready to issue a pass.");

  async function createPass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("creating"); setMessage("Creating the Wallet object…");
    try {
      const response = await fetch("/passes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, label, value: Number(value) }) });
      const data = (await response.json()) as CreatedPass & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not create the pass.");
      setPass(data);
      setMessage(data.mode === "mock" ? "Demo pass created. Configure Google credentials to issue a live Wallet pass." : "Pass created. Save it to Google Wallet, then try a live update.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create the pass."); }
    finally { setState("idle"); }
  }

  async function updatePass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!pass) return;
    setState("updating"); setMessage("Updating the same Wallet object…");
    try {
      const response = await fetch(`/passes/${pass.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ value: Number(nextValue) }) });
      const data = (await response.json()) as { value?: number; updated?: boolean; error?: string };
      if (!response.ok || !data.updated) throw new Error(data.error ?? "The Wallet update did not complete.");
      setPass({ ...pass, value: data.value ?? Number(nextValue) }); setValue(String(data.value ?? nextValue));
      setMessage("Updated successfully — the saved pass will refresh without being re-added.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update the pass."); }
    finally { setState("idle"); }
  }

  return <main className="min-h-screen bg-[#f7f8fa] text-slate-950">
    <section className="mx-auto max-w-6xl px-5 pb-12 pt-7 sm:px-8 sm:pt-10">
      <header className="mb-10 flex items-center justify-between"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1a73e8] text-lg font-black text-white shadow-lg shadow-blue-200">W</div><span className="text-lg font-semibold tracking-tight">Wallet Pulse</span></div><span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">Live object updates</span></header>
      <div className="grid items-start gap-10 lg:grid-cols-[1fr_0.8fr] lg:gap-16">
        <div><p className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.13em] text-[#1967d2]">Google Wallet generic pass</p><h1 className="max-w-xl text-4xl font-semibold leading-[1.03] tracking-[-0.05em] sm:text-6xl">Issue once.<br />Update in place.</h1><p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">Create a pass, save it on Android, and change its value through the API. The same saved Wallet object refreshes — no re-adding required.</p>
          <form onSubmit={createPass} className="mt-9 grid max-w-xl gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.07)] sm:grid-cols-2 sm:p-7">
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Name<input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} required className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Label<input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={60} required className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
            <label className="grid gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">Current value<input type="number" value={value} onChange={(event) => setValue(event.target.value)} required step="any" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 font-normal outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
            <button disabled={state !== "idle"} className="mt-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">{state === "creating" ? "Creating pass…" : "Create pass"}</button>
          </form><p role="status" aria-live="polite" className="mt-4 max-w-xl text-sm text-slate-500">{message}</p>
        </div>
        <aside className="lg:pt-3"><div className="overflow-hidden rounded-[2rem] bg-slate-950 p-1 shadow-2xl shadow-slate-300"><div className="rounded-[1.85rem] bg-gradient-to-br from-[#1a73e8] via-[#1558ad] to-[#0d2e68] p-6 text-white sm:p-8"><div className="flex items-start justify-between text-sm font-medium text-blue-100"><span>Google Wallet</span><span>•••</span></div><p className="mt-12 text-xs font-medium uppercase tracking-[0.15em] text-blue-100">{pass ? label : "Balance"}</p><p className="mt-1 text-5xl font-semibold tracking-tight">{pass ? pass.value : value || "0"}</p><div className="mt-12 flex items-end justify-between gap-4 border-t border-white/20 pt-4"><div><p className="text-xs text-blue-100">Member</p><p className="mt-1 font-medium">{pass ? name : "Alex Morgan"}</p></div><div className="grid h-12 w-12 grid-cols-5 gap-px bg-white p-1" aria-label="QR code appears on the issued Wallet pass">{Array.from({ length: 25 }, (_, i) => <span key={i} className={(i * 7 + 3) % 5 < 2 ? "bg-slate-950" : "bg-white"} />)}</div></div></div></div>
          {pass ? <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Pass issued</p><span className={pass.mode === "google" ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700" : "rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"}>{pass.mode === "google" ? "Google live" : "Mock mode"}</span></div><p className="mt-2 break-all font-mono text-xs text-slate-500">{pass.id}</p>{pass.mode === "google" ? <a href={pass.saveUrl} target="_blank" rel="noreferrer" className="mt-4 block rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 ring-1 ring-slate-300 transition hover:bg-slate-50">Save to Google Wallet</a> : <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-800">Mock mode proves the API flow only. Add your server-side Google issuer credentials to issue a real pass.</p>}<form onSubmit={updatePass} className="mt-4 flex gap-2"><input aria-label="New pass value" type="number" value={nextValue} onChange={(event) => setNextValue(event.target.value)} required step="any" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" /><button disabled={state !== "idle"} className="rounded-xl bg-[#1a73e8] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{state === "updating" ? "Updating…" : "Update"}</button></form></div> : <p className="mt-5 text-center text-sm text-slate-500">Your issued pass will appear here.</p>}</aside>
      </div>
    </section>
  </main>;
}
