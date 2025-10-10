import { useDarkMode } from '../hooks/useDarkMode';
import LightIcon from '../assets/light_mode_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import DarkIcon from '../assets/dark_mode_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';

const ThemeSwitcher = () => {
  const [theme, toggleTheme] = useDarkMode();

  return (
    <button id="theme-switch" onClick={toggleTheme}>
      {theme === 'light' ? <DarkIcon /> : <LightIcon />}
    </button>
  );
};

export default ThemeSwitcher;
