'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import ChatInterface from '@/components/ChatInterface';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { isInterviewOnCooldown, getRemainingTime, formatRemainingTime } from '@/utils/interviewTimer';
import styles from '../page.module.css';

export default function Home() {
  const t = useTranslations();
  const tChat = useTranslations('ChatInterface');
  const locale = useLocale();
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(null);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [showNoticeDialog, setShowNoticeDialog] = useState(false);
  const noticeContentRef = useRef<HTMLDivElement>(null);
  const featuresSectionRef = useRef<HTMLElement>(null);
  const stepsSectionRef = useRef<HTMLElement>(null);
  const faqSectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const checkCooldown = () => {
      const onCooldown = isInterviewOnCooldown();
      setIsOnCooldown(onCooldown);
      if (onCooldown) {
        const remaining = getRemainingTime();
        setCooldownRemaining(remaining);
      } else {
        setCooldownRemaining(null);
      }
    };

    checkCooldown();
    const interval = setInterval(() => {
      const onCooldown = isInterviewOnCooldown();
      setIsOnCooldown(onCooldown);
      if (onCooldown) {
        const remaining = getRemainingTime();
        setCooldownRemaining(remaining);
      } else {
        setCooldownRemaining(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('preserveScroll');
    if (savedScroll) {
      const scrollPosition = parseInt(savedScroll, 10);
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
        sessionStorage.removeItem('preserveScroll');
      });
    }
  }, [locale]);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.animateIn);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    const sections = [
      featuresSectionRef.current,
      stepsSectionRef.current,
      faqSectionRef.current,
    ].filter(Boolean) as HTMLElement[];

    sections.forEach((section) => {
      if (section) {
        observer.observe(section);
      }
    });

    return () => {
      sections.forEach((section) => {
        if (section) {
          observer.unobserve(section);
        }
      });
    };
  }, []);

  const handleStartInterview = () => {
    if (!isOnCooldown) {
      setShowNoticeDialog(true);
    }
  };

  useEffect(() => {
    if (showNoticeDialog) {
      if (noticeContentRef.current) {
        noticeContentRef.current.scrollTop = 0;
      }
      
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [showNoticeDialog]);

  const handleConfirmNotice = () => {
    setShowNoticeDialog(false);
    setIsInterviewStarted(true);
  };

  const handleCloseNotice = () => {
    setShowNoticeDialog(false);
  };

  if (isInterviewStarted) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <ChatInterface 
            onReset={() => setIsInterviewStarted(false)} 
            autoStart={true}
          />
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <section className={styles.heroSection}>
          <div className={styles.heroHeader}>
            <LanguageSwitcher />
          </div>
          {isOnCooldown && cooldownRemaining !== null && (
            <div className={styles.cooldownOverlay}>
              <div className={styles.cooldownContainer}>
                <div className={styles.cooldownMessage}>
                  <span className="material-icons">schedule</span>
                  <p>{tChat('cooldown.message')}</p>
                </div>
                <div className={styles.cooldownTimer}>
                  {(() => {
                    const { days, hours, minutes, seconds } = formatRemainingTime(cooldownRemaining);
                    return (
                      <>
                        {days > 0 && <span>{days}{tChat('cooldown.days')}</span>}
                        <span>{String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          <div className={styles.heroContent}>
            <span className={`material-icons ${styles.heroIcon}`}>record_voice_over</span>
            <h1 className={styles.heroTitle}>{t('common.title')}</h1>
            <p className={styles.heroSubtitle}>{t('common.subtitle')}</p>
            {isOnCooldown ? (
              <button className={styles.heroButton} disabled>
                <span className="material-icons">lock</span>
                {tChat('cooldown.button')}
              </button>
            ) : (
              <button onClick={handleStartInterview} className={styles.heroButton}>
                <span className="material-icons">play_arrow</span>
                {tChat('welcome.startButton')}
              </button>
            )}
          </div>
        </section>

        <div className={styles.homeContent}>

          <section ref={featuresSectionRef} className={styles.featuresSection}>
            <h2 className={styles.sectionTitle}>{tChat('welcome.features.title')}</h2>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <span className="material-icons">feedback</span>
                <h3>{tChat('welcome.features.realtime.title')}</h3>
                <p>{tChat('welcome.features.realtime.description')}</p>
              </div>
              <div className={styles.featureCard}>
                <span className="material-icons">language</span>
                <h3>{tChat('welcome.features.multilang.title')}</h3>
                <p>{tChat('welcome.features.multilang.description')}</p>
              </div>
              <div className={styles.featureCard}>
                <span className="material-icons">lock</span>
                <h3>{tChat('welcome.features.privacy.title')}</h3>
                <p>{tChat('welcome.features.privacy.description')}</p>
              </div>
            </div>
          </section>

          <section ref={stepsSectionRef} className={styles.stepsSection}>
            <h2 className={styles.sectionTitle}>{tChat('welcome.steps.title')}</h2>
            <div className={styles.stepsList}>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h3>{tChat('welcome.steps.step1.title')}</h3>
                  <p>{tChat('welcome.steps.step1.description')}</p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h3>{tChat('welcome.steps.step2.title')}</h3>
                  <p>{tChat('welcome.steps.step2.description')}</p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h3>{tChat('welcome.steps.step3.title')}</h3>
                  <p>{tChat('welcome.steps.step3.description')}</p>
                </div>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>4</div>
                <div className={styles.stepContent}>
                  <h3>{tChat('welcome.steps.step4.title')}</h3>
                  <p>{tChat('welcome.steps.step4.description')}</p>
                </div>
              </div>
            </div>
          </section>

          <section ref={faqSectionRef} className={styles.faqSection}>
            <h2 className={styles.sectionTitle}>{tChat('welcome.faq.title')}</h2>
            <div className={styles.faqList}>
              <details key={`faq-1-${locale}`} className={styles.faqItem}>
                <summary>{tChat('welcome.faq.q1.question')}</summary>
                <p>{tChat('welcome.faq.q1.answer')}</p>
              </details>
              <details key={`faq-2-${locale}`} className={styles.faqItem}>
                <summary>{tChat('welcome.faq.q2.question')}</summary>
                <p>{tChat('welcome.faq.q2.answer')}</p>
              </details>
              <details key={`faq-3-${locale}`} className={styles.faqItem}>
                <summary>{tChat('welcome.faq.q3.question')}</summary>
                <p>{tChat('welcome.faq.q3.answer')}</p>
              </details>
              <details key={`faq-4-${locale}`} className={styles.faqItem}>
                <summary>{tChat('welcome.faq.q4.question')}</summary>
                <p>{tChat('welcome.faq.q4.answer')}</p>
              </details>
              <details key={`faq-5-${locale}`} className={styles.faqItem}>
                <summary>{tChat('welcome.faq.q5.question')}</summary>
                <p>{tChat('welcome.faq.q5.answer')}</p>
              </details>
            </div>
          </section>
        </div>
      </main>
      <footer className={styles.footer}>
        <section className={styles.disclaimerSection}>
          <div className={styles.disclaimerContent}>
            <span className="material-icons">info</span>
            <p>{t('common.disclaimer')}</p>
          </div>
        </section>
        <p>{t('footer.copyright')}</p>
      </footer>

      {showNoticeDialog && (
        <div className={styles.noticeOverlay} onClick={handleCloseNotice}>
          <div className={styles.noticeDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.noticeHeader}>
              <div className={styles.noticeHeaderContent}>
                <span className="material-icons">info</span>
                <h2>{tChat('notice.title')}</h2>
              </div>
              <button 
                className={styles.closeButton}
                onClick={handleCloseNotice}
                aria-label={tChat('notice.close')}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div 
              className={styles.noticeContent}
              ref={noticeContentRef}
            >
              <div className={styles.noticeSection}>
                <h3>{tChat('notice.section1.title')}</h3>
                <p>{tChat('notice.section1.content')}</p>
              </div>
              <div className={styles.noticeSection}>
                <h3>{tChat('notice.section2.title')}</h3>
                <p>{tChat('notice.section2.content')}</p>
              </div>
              <div className={styles.noticeSection}>
                <h3>{tChat('notice.section3.title')}</h3>
                <p>{tChat('notice.section3.content')}</p>
              </div>
              <div className={styles.noticeSection}>
                <h3>{tChat('notice.disclaimer.title')}</h3>
                <p className={styles.disclaimerText}>{t('common.disclaimer')}</p>
              </div>
            </div>
            <div className={styles.noticeFooter}>
              <p className={styles.waitingText}>{tChat('notice.waiting')}</p>
              <button onClick={handleConfirmNotice} className={styles.confirmButton}>
                {tChat('notice.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
