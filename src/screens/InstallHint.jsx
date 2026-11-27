import { useState } from 'preact/hooks';

// Safari may wipe a website's data after ~7 days without a visit.
// Apps added to the Home Screen are exempt, so we nudge people to install.
const standalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

export function InstallHint() {
  const [hidden, setHidden] = useState(() => standalone() || localStorage.getItem('installHintHidden') === '1');
  if (hidden) return null;
  return (
    <div class="hint" role="note">
      <b>Установите на экран «Домой»</b>
      <p>
        В Safari нажмите «Поделиться», затем «На экран „Домой“». Так приложение работает без интернета и не теряет
        данные.
      </p>
      <button
        class="linkish"
        onClick={() => {
          localStorage.setItem('installHintHidden', '1');
          setHidden(true);
        }}
      >
        Понятно
      </button>
    </div>
  );
}
