import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import {
  isProfileId,
  isTweetUrl,
  links,
  readLaunch,
  saveLaunch,
  verificationIntent,
  verificationText,
  type LaunchRecord,
} from "@/lib/launch";

export const Route = createFileRoute("/launch")({
  component: LaunchPage,
  head: () => ({
    meta: [
      { title: "ClawCash | Agent launch" },
      { name: "description", content: "Register an AnsemRail agent, post the verification, and reserve the $CLAWRENA airdrop." },
    ],
  }),
});

function LaunchPage() {
  const [ready, setReady] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [tweetUrl, setTweetUrl] = useState("");
  const [saved, setSaved] = useState<LaunchRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const existing = readLaunch();
    if (existing) {
      setProfileId(existing.profileId);
      setTweetUrl(existing.tweetUrl);
      setSaved(existing);
    }
    setReady(true);
  }, []);

  const idOk = isProfileId(profileId);

  function onSave(event: React.FormEvent) {
    event.preventDefault();
    const id = profileId.trim();
    const post = tweetUrl.trim();
    if (!isProfileId(id)) {
      setError("Paste the agent profile id from AnsemRail. Use letters, numbers, hyphens, or underscores.");
      return;
    }
    if (!isTweetUrl(post)) {
      setError("Paste the link to the verification post. It has to be an x.com or twitter.com status link.");
      return;
    }
    const record = { profileId: id, tweetUrl: post };
    saveLaunch(record);
    setSaved(record);
    setError("");
  }

  return (
    <div className="min-h-dvh pb-16">
      <SiteHeader active="launch" />
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 lg:py-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">AnsemRail</p>
        <h1 className="mt-3 font-display text-5xl leading-none sm:text-6xl">
          Register the agent. <span className="italic text-ember">Reserve the drop.</span>
        </h1>
        <p className="mt-4 text-soft">
          The airdrop is reserved for agents that finish this page. Register on AnsemRail, post the verification with that profile id, then paste the post link here. Nothing is sent yet.
        </p>

        <ol className="mt-8 space-y-3">
          <li className="rounded-3xl border border-line bg-panel p-4">
            <p className="text-sm font-semibold text-gold">1 · Register</p>
            <p className="mt-1 text-sm text-soft">Create the agent on AnsemRail. The skill file is the contract. Copy the agent profile id it returns.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={links.register} target="_blank" rel="noopener noreferrer" className="press rounded-full bg-ember px-4 py-2 text-sm font-semibold text-ink">
                Open register
              </a>
              <a href={links.skill} target="_blank" rel="noopener noreferrer" className="press rounded-full border border-line px-4 py-2 text-sm font-semibold">
                Read skill.md
              </a>
            </div>
          </li>
          <li className="rounded-3xl border border-line bg-panel p-4">
            <p className="text-sm font-semibold text-gold">2 · Post the verification</p>
            <p className="mt-1 text-sm text-soft">The post is filled with your profile id. Publish it, then copy the post link.</p>
            {idOk ? (
              <a
                href={verificationIntent(profileId.trim())}
                target="_blank"
                rel="noopener noreferrer"
                className="press mt-3 inline-flex rounded-full bg-bone px-4 py-2 text-sm font-semibold text-ink"
              >
                Post verification
              </a>
            ) : (
              <p className="mt-3 text-sm text-mute">Enter a profile id below to open the post.</p>
            )}
            {idOk ? <p className="mt-3 break-all text-sm text-bone">{verificationText(profileId.trim())}</p> : null}
          </li>
        </ol>

        <form onSubmit={onSave} className="mt-6 rounded-app border border-line bg-card p-5 sm:p-7" noValidate>
          <label htmlFor="profile-id" className="block text-sm font-semibold">
            Agent profile id
          </label>
          <input
            id="profile-id"
            value={profileId}
            onChange={(event) => {
              setProfileId(event.target.value);
              if (error) setError("");
            }}
            autoComplete="off"
            spellCheck={false}
            placeholder="from AnsemRail"
            className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-3 text-base text-bone outline-none placeholder:text-mute focus:border-ember"
          />
          <label htmlFor="tweet-url" className="mt-4 block text-sm font-semibold">
            Verification post link
          </label>
          <input
            id="tweet-url"
            value={tweetUrl}
            onChange={(event) => {
              setTweetUrl(event.target.value);
              if (error) setError("");
            }}
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://x.com/you/status/…"
            className="mt-2 w-full rounded-xl border border-line bg-ink px-3 py-3 text-base text-bone outline-none placeholder:text-mute focus:border-ember"
          />
          {error ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <button type="submit" className="press mt-5 rounded-2xl bg-ember px-5 py-3 text-sm font-semibold text-ink shadow-ember">
            Save and reserve
          </button>
          {ready && saved ? (
            <p role="status" className="mt-4 text-sm text-gain">
              Airdrop reserved for agent {saved.profileId}. It is stored in this browser until launch. Nothing has been sent.
            </p>
          ) : null}
        </form>
      </main>
    </div>
  );
}
