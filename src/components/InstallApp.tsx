import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferredPrompt: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();

function notifyInstallState() {
  listeners.forEach((listener) => listener());
}

function subscribeInstallState(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getInstallState() {
  return { canPrompt: Boolean(deferredPrompt), installed };
}

async function promptInstall() {
  if (!deferredPrompt) return false;
  const prompt = deferredPrompt;
  deferredPrompt = null;
  notifyInstallState();
  await prompt.prompt();
  const choice = await prompt.userChoice;
  return choice.outcome === "accepted";
}

function useInstallState() {
  return useSyncExternalStore(subscribeInstallState, getInstallState, () => ({ canPrompt: false, installed: false }));
}

export function InstallAction({ className = "" }: { className?: string }) {
  const { apkUrl } = useStore();
  const { canPrompt, installed: isInstalled } = useInstallState();
  const [showHelp, setShowHelp] = useState(false);

  if (isInstalled) return null;
  if (!canPrompt && apkUrl) {
    return (
      <Button asChild variant="outline" size="sm" className={className}>
        <a href={apkUrl} target="_blank" rel="noreferrer" aria-label="Download Remo Collections Android app">
          <Download aria-hidden="true" /> <span>Download App</span>
        </a>
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        aria-label="Install Remo Collections app"
        onClick={() => {
          if (canPrompt) void promptInstall();
          else setShowHelp(true);
        }}
      >
        <Download aria-hidden="true" /> <span>Install App</span>
      </Button>
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/40 p-4 sm:items-center" onClick={() => setShowHelp(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-help-title"
            className="w-full max-w-sm space-y-3 rounded-lg border border-border bg-background p-5 text-foreground shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="install-help-title" className="font-display text-lg font-bold">Add Remo Collections</h2>
              <Button variant="ghost" size="icon" aria-label="Close install help" onClick={() => setShowHelp(false)}>
                <X aria-hidden="true" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Open your browser’s Share or menu button, then choose “Add to Home Screen” or “Install app”.
            </p>
            {apkUrl && (
              <Button asChild className="w-full">
                <a href={apkUrl} target="_blank" rel="noreferrer">Download Android APK</a>
              </Button>
            )}
          </section>
        </div>
      )}
    </>
  );
}

export function InstallApp() {
  const { apkUrl } = useStore();
  const { canPrompt, installed: isInstalled } = useInstallState();
  const [mobile, setMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferredPrompt = event as InstallPromptEvent;
      notifyInstallState();
    };
    const onInstalled = () => {
      installed = true;
      deferredPrompt = null;
      notifyInstallState();
    };
    const media = window.matchMedia("(max-width: 767px)");
    const updateMobile = () => setMobile(media.matches);
    updateMobile();
    media.addEventListener("change", updateMobile);
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      media.removeEventListener("change", updateMobile);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!mobile || isInstalled || (!canPrompt && !apkUrl)) return;
    try {
      setDismissed(window.sessionStorage.getItem("remo-install-banner-dismissed") === "1");
    } catch {
      setDismissed(false);
    }
  }, [mobile, canPrompt, isInstalled, apkUrl]);

  if (!mobile || dismissed || isInstalled || (!canPrompt && !apkUrl)) return null;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-lg items-center gap-3 rounded-lg border border-border bg-background p-3 text-foreground shadow-lg md:hidden">
      <img src="/icon-192.png" alt="" width={44} height={44} className="h-11 w-11 rounded-md" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-bold">Remo Collections</p>
        <p className="text-xs text-muted-foreground">Add our shop to your home screen</p>
      </div>
      {canPrompt ? (
        <Button size="sm" onClick={() => void promptInstall()}>Install</Button>
      ) : (
        <Button asChild size="sm">
          <a href={apkUrl} target="_blank" rel="noreferrer">Download</a>
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Dismiss app install banner"
        onClick={() => {
          setDismissed(true);
          try {
            window.sessionStorage.setItem("remo-install-banner-dismissed", "1");
          } catch {
            // Dismissal remains active for this page view.
          }
        }}
      >
        <X aria-hidden="true" />
      </Button>
    </aside>
  );
}