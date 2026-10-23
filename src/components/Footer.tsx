import { DATA_URL, REPO_URL } from "@/config";

export function Footer({ onRules }: { onRules: () => void }) {
  return (
    <footer className="flex flex-wrap justify-center gap-x-5 gap-y-1 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-[13px] text-white/75">
      <button type="button" onClick={onRules} className="footer-link">
        Как считаются баллы
      </button>
      <a href={DATA_URL} target="_blank" rel="noopener noreferrer" className="footer-link">
        Данные: Авито
      </a>
      {REPO_URL && (
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="footer-link">
          Код на GitHub
        </a>
      )}
    </footer>
  );
}
