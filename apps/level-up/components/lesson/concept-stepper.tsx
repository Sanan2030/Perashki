'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@/lib/types';
export function ConceptStepper({ locale = 'az' }: { locale?: Locale }) {
  const [step, setStep] = useState(0);
  const reduce = useReducedMotion();
  const az = locale === 'az';
  const steps = az
    ? [
        [
          'Məqsədi anla',
          'Komanda və maraqlı tərəflərlə hansı nəticənin dəyərli olduğunu aydınlaşdır.',
        ],
        [
          'Kiçik addımı seç',
          'Məqsədə doğru irəliləməyə kömək edəcək ən kiçik yoxlanıla bilən işi seç.',
        ],
        [
          'Sına və müşahidə et',
          'Nəticəni istifadəçilərlə yoxla. Fərziyyəni müşahidə olunan sübutdan ayır.',
        ],
        ['Uyğunlaşdır', 'Nə öyrəndiyini paylaş və növbəti addımı yeni məlumata əsasən dəyiş.'],
      ]
    : [
        [
          'Understand the goal',
          'Work with the team and stakeholders to make the valuable outcome clear.',
        ],
        [
          'Choose a small step',
          'Select the smallest testable change that can move you toward the goal.',
        ],
        [
          'Test and observe',
          'Try the outcome with users. Separate your assumptions from the evidence.',
        ],
        [
          'Adapt together',
          'Share what you learned and adjust your next step using the new information.',
        ],
      ];
  return (
    <div className="concept-stepper">
      <div className="stepper-dots">
        {steps.map((s, i) => (
          <button
            type="button"
            key={s[0]}
            aria-current={step === i ? 'step' : undefined}
            aria-label={s[0]}
            onClick={() => setStep(i)}
            className={i <= step ? 'reached' : ''}
          >
            {i < step ? <Check size={14} /> : i + 1}
          </button>
        ))}
      </div>
      <motion.div
        key={step}
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        aria-live="polite"
      >
        <h3>{steps[step][0]}</h3>
        <p>{steps[step][1]}</p>
      </motion.div>
      <div className="stepper-actions">
        <button
          type="button"
          className="button button-secondary"
          disabled={step === 0}
          onClick={() => setStep((s) => s - 1)}
        >
          <ArrowLeft size={15} />
          {az ? 'Əvvəlki' : 'Previous'}
        </button>
        <span>
          {step + 1} / {steps.length}
        </span>
        <button
          type="button"
          className="button button-primary"
          disabled={step === steps.length - 1}
          onClick={() => setStep((s) => s + 1)}
        >
          {az ? 'Növbəti' : 'Next'}
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
