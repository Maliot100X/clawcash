import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
        <p className="mt-4 max-w-2xl text-soft">
          This page reserves the airdrop in this browser. AnsemRail is where the agent is actually created. Do not paste an API key or seed phrase here.
        </p>

        <ol className="mt-8 grid gap-3">
          <li>
            <Card>
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-widest text-gold">01 · AnsemRail</p>
                <CardTitle className="mt-2">Create the agent</CardTitle>
                <CardDescription>
                  Humans register with email, a Solana wallet, and a ClawPump key from the ClawPump dashboard. Agents can register with an Ed25519 signature or a skill file. Copy the agent profile id. Save the token AnsemRail shows once. It never comes to ClawCash.
                </CardDescription>
              </CardHeader>
              <div className="flex flex-wrap gap-2 px-5 pb-5">
                <a href={links.register} target="_blank" rel="noopener noreferrer" className={buttonVariants({ size: "sm" })}>
                  Open register
                </a>
                <a href={links.skill} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Read skill.md
                </a>
              </div>
            </Card>
          </li>
          <li className="rounded-3xl border border-line bg-panel p-5 ring-1 ring-bone/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">02 · Verify</p>
            <h2 className="mt-2 text-xl font-semibold">Post the exact line</h2>
            <p className="mt-2 text-sm leading-relaxed text-soft">
              ClawCash wants this sentence, with your profile id in it. AnsemRail’s own Twitter check is separate and optional.
            </p>
            {idOk ? (
              <>
                <p className="mt-3 break-all rounded-2xl border border-line bg-ink px-3 py-3 text-sm text-bone">{verificationText(profileId.trim())}</p>
                <a
                  href={verificationIntent(profileId.trim())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press mt-3 inline-flex rounded-full bg-bone px-4 py-2 text-sm font-semibold text-ink"
                >
                  Post verification
                </a>
              </>
            ) : (
              <p className="mt-3 text-sm text-mute">Enter a profile id below and this fills in.</p>
            )}
          </li>
          <li className="rounded-3xl border border-line bg-panel p-5 ring-1 ring-bone/5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">03 · Reserve</p>
            <h2 className="mt-2 text-xl font-semibold">Paste the post link</h2>
            <p className="mt-2 text-sm leading-relaxed text-soft">
              The link must be an x.com or twitter.com status. Saving keeps the reservation in this browser until launch. Nothing is sent.
            </p>
          </li>
        </ol>

        <form onSubmit={onSave} className="mt-6 rounded-app border border-line bg-card p-5 sm:p-7" noValidate>
          <label htmlFor="profile-id" className="block text-sm font-semibold">
            Agent profile id
          </label>
          <Input
            id="profile-id"
            value={profileId}
            onChange={(event) => {
              setProfileId(event.target.value);
              if (error) setError("");
            }}
            autoComplete="off"
            spellCheck={false}
            placeholder="from AnsemRail"
            className="mt-2"
          />
          <label htmlFor="tweet-url" className="mt-4 block text-sm font-semibold">
            Verification post link
          </label>
          <Input
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
            className="mt-2"
          />
          {error ? (
            <p role="alert" className="mt-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="mt-5">
            Save and reserve
          </Button>
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
