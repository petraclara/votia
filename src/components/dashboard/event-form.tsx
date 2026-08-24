"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ImageField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const data = new FormData();
    data.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: data });
    const json = await response.json();
    setUploading(false);
    if (json.url) setUrl(json.url);
  }

  return (
    <label className="block text-sm font-semibold text-navy">
      {label}
      <input type="hidden" name={name} value={url} />
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Image URL"
        className="mt-1 h-12 w-full rounded-2xl border border-border px-4 font-normal"
      />
      <input
        type="file"
        accept="image/*"
        className="mt-2 text-sm font-normal"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      {uploading ? <p className="text-xs text-muted">Uploading...</p> : null}
    </label>
  );
}

export function EventForm({
  action,
  event,
}: {
  action: (formData: FormData) => Promise<void>;
  event?: {
    name: string;
    description: string;
    location: string;
    venue: string;
    eventDate: Date;
    votingStart: Date | null;
    votingEnd: Date | null;
    votePrice: number;
    mode: string;
    voteVisibility: string;
    status: string;
    poster: string;
    banner: string;
  };
}) {
  return (
    <form action={action} className="grid gap-4">
      <input name="name" defaultValue={event?.name} required placeholder="Event name" className="h-12 rounded-2xl border border-border px-4" />
      <textarea name="description" defaultValue={event?.description} required placeholder="Description" rows={5} className="rounded-2xl border border-border px-4 py-3" />
      <div className="grid gap-3 md:grid-cols-2">
        <input name="location" defaultValue={event?.location} required placeholder="Location" className="h-12 rounded-2xl border border-border px-4" />
        <input name="venue" defaultValue={event?.venue} required placeholder="Venue" className="h-12 rounded-2xl border border-border px-4" />
      </div>
      <label className="text-sm font-semibold">
        Event date
        <input name="eventDate" type="datetime-local" required defaultValue={toLocal(event?.eventDate)} className="mt-1 h-12 w-full rounded-2xl border border-border px-4 font-normal" />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold">
          Voting start
          <input name="votingStart" type="datetime-local" defaultValue={toLocal(event?.votingStart)} className="mt-1 h-12 w-full rounded-2xl border border-border px-4 font-normal" />
        </label>
        <label className="text-sm font-semibold">
          Voting end
          <input name="votingEnd" type="datetime-local" defaultValue={toLocal(event?.votingEnd)} className="mt-1 h-12 w-full rounded-2xl border border-border px-4 font-normal" />
        </label>
      </div>
      <label className="text-sm font-semibold">
        Price per vote (KES)
        <input name="votePrice" type="number" min={1} defaultValue={event?.votePrice ?? 10} className="mt-1 h-12 w-full rounded-2xl border border-border px-4 font-normal" />
      </label>
      <label className="text-sm font-semibold">
        Event type
        <select name="mode" defaultValue={event?.mode ?? "VOTING_ONLY"} className="mt-1 h-12 w-full rounded-2xl border border-border px-4 font-normal">
          <option value="VOTING_ONLY">Voting only</option>
          <option value="TICKETS_ONLY">Tickets only</option>
          <option value="VOTING_AND_TICKETS">Voting + tickets</option>
        </select>
      </label>
      <label className="text-sm font-semibold">
        Public vote counts
        <select name="voteVisibility" defaultValue={event?.voteVisibility ?? "AFTER_CLOSE"} className="mt-1 h-12 w-full rounded-2xl border border-border px-4 font-normal">
          <option value="VISIBLE">Visible</option>
          <option value="HIDDEN">Hidden</option>
          <option value="AFTER_CLOSE">Visible only after voting closes</option>
        </select>
      </label>
      <label className="text-sm font-semibold">
        Status
        <select name="status" defaultValue={event?.status ?? "UPCOMING"} className="mt-1 h-12 w-full rounded-2xl border border-border px-4 font-normal">
          <option value="DRAFT">Draft</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="LIVE">Live</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </label>
      <ImageField name="poster" label="Event poster" defaultValue={event?.poster} />
      <ImageField name="banner" label="Event banner" defaultValue={event?.banner} />
      <Button type="submit">{event ? "Save event" : "Create event"}</Button>
    </form>
  );
}

function toLocal(date?: Date | null) {
  if (!date) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
