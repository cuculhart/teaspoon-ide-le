import React from 'react'
import { useT } from '../services/i18nService'
import iconUrl from '../../assets/icon.png'
import './About.css'

interface AboutProps {
  onClose: () => void
}

const About: React.FC<AboutProps> = ({ onClose }) => {
  const t = useT()

  const openSite = () => {
    window.electronAPI?.openExternal('https://cuculhart.com')
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal about-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{t('About Teaspoon IDE Local Edition')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="settings-content about-content">
          <img src={iconUrl} className="about-icon" alt="Teaspoon IDE Local Edition" />
          <h3 className="about-app-name">Teaspoon IDE Local Edition</h3>
          <p className="about-version">{t('Version')} 1.0.0</p>
          <p className="about-tagline">
            {t('Offline-first, local-only AI IDE (Japanese)')}
          </p>
          <p className="about-license">
            {t('License')}: FSL-1.1-MIT
          </p>
          <table className="about-table">
            <tbody>
              <tr>
                <td className="about-label">{t('Author')}</td>
                <td>Teaspoon LE contributors</td>
              </tr>
              <tr>
                <td className="about-label">{t('Web Site')}</td>
                <td>
                  <button className="about-link" onClick={openSite}>
                    https://cuculhart.com
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default About
