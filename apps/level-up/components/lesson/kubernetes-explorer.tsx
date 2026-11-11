'use client';
import { useUIText, useLocale } from '@/components/use-ui-text';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Box,
  Boxes,
  Check,
  Container,
  FileCode2,
  KeyRound,
  Layers,
  Play,
  RotateCcw,
  Server,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import styles from './kubernetes-explorer.module.css';

const journey = [
  {
    title: 'Write a Dockerfile',
    icon: FileCode2,
    detail:
      'Describe the base image, application files and startup command. Keep passwords and local files outside the build context.',
    code: 'FROM nginx:stable-alpine\nCOPY index.html /usr/share/nginx/html/index.html',
  },
  {
    title: 'Build an image',
    icon: Box,
    detail:
      'Build an immutable package. The image is a template, not a running application. A digest identifies the exact artifact.',
    code: 'docker build -t orders-web:1.0 .\ndocker image inspect orders-web:1.0',
  },
  {
    title: 'Run a container',
    icon: Container,
    detail:
      'Start a process from the image. Two containers can use the same image while keeping separate writable layers.',
    code: 'docker run --rm -p 8080:80 orders-web:1.0',
  },
  {
    title: 'Push to a registry',
    icon: Layers,
    detail:
      'Publish the image to a registry your cluster can reach. Kubernetes nodes pull that artifact; Kubernetes does not build your Dockerfile.',
    code: 'docker tag orders-web:1.0 REGISTRY/orders-web:1.0\ndocker push REGISTRY/orders-web:1.0',
  },
  {
    title: 'Declare a Deployment',
    icon: FileCode2,
    detail:
      'Send desired state to the API server. The Deployment controller manages ReplicaSets, which maintain the requested Pods.',
    code: 'kubectl apply -f orders.yaml\n# Deployment → ReplicaSet → Pods',
  },
  {
    title: 'Schedule and serve',
    icon: Server,
    detail:
      'The scheduler selects nodes. Each node’s kubelet asks a CRI runtime to start containers. A Service routes to matching ready Pods in its namespace.',
    code: 'kubectl -n demo get deploy,rs,pods,svc\nkubectl -n demo rollout status deployment/orders',
  },
];

export function KubernetesExplorer() {
  const t = useUIText();
  const id = useId();
  const [tab, setTab] = useState('journey');
  const tabs = [
    ['journey', 'Image to cluster'],
    ['cluster', 'Pods & rollout'],
    ['selectors', 'Labels & namespaces'],
    ['configuration', 'ConfigMap & Vault'],
  ];
  return (
    <section
      className={styles.explorer}
      aria-label={t('Docker and Kubernetes interactive explorer')}
    >
      <div className={styles.header}>
        <span className={styles.kicker}>{t('LEARN BY CHANGING THINGS')}</span>
        <h3>{t('Inside the cluster')}</h3>
        <p>{t('A visual simulation. Explore each view; nothing runs against a real cluster.')}</p>
      </div>
      <div className={styles.tabs} role="tablist" aria-label={t('Explorer views')}>
        {tabs.map(([key, label], index) => (
          <button
            key={key}
            id={`${id}-${key}-tab`}
            type="button"
            role="tab"
            aria-selected={tab === key}
            aria-controls={`${id}-${key}-panel`}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
              else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
              else if (event.key === 'Home') next = 0;
              else if (event.key === 'End') next = tabs.length - 1;
              else return;
              event.preventDefault();
              setTab(tabs[next][0]);
              document.getElementById(`${id}-${tabs[next][0]}-tab`)?.focus();
            }}
          >
            {t(label)}
          </button>
        ))}
      </div>
      {tabs.map(([key]) => (
        <div
          key={key}
          className={styles.panel}
          id={`${id}-${key}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-${key}-tab`}
          hidden={tab !== key}
          tabIndex={0}
        >
          {tab === key && key === 'journey' && <ImageJourney />}
          {tab === key && key === 'cluster' && <Cluster />}
          {tab === key && key === 'selectors' && <Selectors />}
          {tab === key && key === 'configuration' && <Configuration />}
        </div>
      ))}
    </section>
  );
}

function ImageJourney() {
  const t = useUIText();
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing || reduce) return;
    const timer = window.setInterval(() => setStep((value) => (value + 1) % journey.length), 4500);
    return () => window.clearInterval(timer);
  }, [playing, reduce]);
  const current = journey[step];
  return (
    <>
      <div className={styles.journey}>
        {journey.map(({ title, icon: Icon }, index) => (
          <button
            key={t(title)}
            type="button"
            onClick={() => {
              setStep(index);
              setPlaying(false);
            }}
            aria-current={step === index ? 'step' : undefined}
          >
            <span>
              <Icon size={23} aria-hidden="true" />
            </span>
            <small>0{index + 1}</small>
            {t(title)}
          </button>
        ))}
      </div>
      <motion.div
        key={step}
        initial={reduce ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.explanation}
        aria-live="polite"
      >
        <strong>
          {step + 1}. {t(current.title)}
        </strong>
        <p>{t(current.detail)}</p>
        <pre tabIndex={0}>
          <code>{current.code}</code>
        </pre>
      </motion.div>
      <div className={styles.actions}>
        <button
          className="button button-secondary"
          type="button"
          disabled={step === 0}
          onClick={() => {
            setPlaying(false);
            setStep(step - 1);
          }}
        >
          {t('Previous step')}
        </button>
        <button
          className="button button-primary"
          type="button"
          disabled={step === journey.length - 1}
          onClick={() => {
            setPlaying(false);
            setStep(step + 1);
          }}
        >
          {t('Next step')}
          <ArrowRight size={15} />
        </button>
        <button
          className={`button button-secondary ${styles.animationToggle}`}
          type="button"
          onClick={() => setPlaying(!playing)}
        >
          <Play size={15} />
          {t(playing ? 'Pause animation' : 'Play animation')}
        </button>
      </div>
    </>
  );
}

function Cluster() {
  const t = useUIText();
  const az = useLocale() === 'az';
  const reduce = useReducedMotion();
  const [replicas, setReplicas] = useState(3);
  const [generation, setGeneration] = useState(0);
  const [recovering, setRecovering] = useState(false);
  const [rollout, setRollout] = useState(0);
  const [message, setMessage] = useState('Desired state matches actual state: 3 ready Pods.');
  const rolling = rollout > 0 && rollout < replicas * 2;
  const v2 = Math.ceil(rollout / 2);
  const v1 = replicas - Math.floor(rollout / 2) - (recovering ? 1 : 0);
  useEffect(() => {
    if (!recovering) return;
    const timer = window.setTimeout(() => {
      setGeneration((v) => v + 1);
      setRecovering(false);
      setMessage('Reconciled: the ReplicaSet created a replacement Pod with a new identity.');
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [recovering]);
  const reset = () => {
    setReplicas(3);
    setRollout(0);
    setGeneration(0);
    setRecovering(false);
    setMessage('Reset: 3 ready Pods running v1.');
  };
  return (
    <>
      <div className={styles.controls}>
        <label>
          {t('Desired replicas')}
          <select
            value={replicas}
            disabled={recovering || rollout > 0}
            onChange={(e) => {
              const n = Number(e.target.value);
              setReplicas(n);
              setMessage(
                az
                  ? `ReplicaSet indi ${n} Ready Pod saxlayır.`
                  : `Scaled: the ReplicaSet now maintains ${n} ready Pods.`,
              );
            }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <span className={styles.chip}>namespace: demo</span>
        <button type="button" className="button button-secondary" onClick={reset}>
          <RotateCcw size={14} />
          {t('Reset cluster')}
        </button>
      </div>
      <div className={styles.deployment}>
        <Layers size={22} />
        <div>
          <strong>Deployment / orders</strong>
          <small>replicas: {replicas} · maxSurge: 1 · maxUnavailable: 0</small>
        </div>
      </div>
      <div className={styles.branch}>
        {az ? '↓ ReplicaSet-ləri idarə edir ↓' : '↓ manages ReplicaSets ↓'}
      </div>
      <div className={styles.replicaGrid}>
        {[{ version: 'v1', count: v1 }, ...(rollout ? [{ version: 'v2', count: v2 }] : [])].map(
          ({ version, count }) => (
            <div key={version} className={styles.replicaSet}>
              <strong>
                <Boxes size={17} /> ReplicaSet / orders-{version}
              </strong>
              <small>
                {count} {az ? 'Ready Pod' : count === 1 ? 'ready Pod' : 'ready Pods'}
              </small>
              <div className={styles.pods}>
                <AnimatePresence initial={false}>
                  {Array.from({ length: count }, (_, i) => (
                    <motion.div
                      layout={!reduce}
                      key={`${version}-${i}-${version === 'v1' && i === replicas - 1 ? generation : 0}`}
                      initial={reduce ? false : { opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.85 }}
                      transition={{ duration: reduce ? 0 : 0.25 }}
                      className={styles.pod}
                    >
                      <Container size={20} />
                      <strong>
                        orders-{version}-{i + 1}
                        {version === 'v1' && i === replicas - 1 && generation > 0
                          ? `-r${generation}`
                          : ''}
                      </strong>
                      <span>
                        <Check size={12} />
                        Ready · {version}
                      </span>
                      <small>app: orders</small>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ),
        )}
      </div>
      <p className={styles.status} role="status">
        {t(message)} Ready: {v1 + v2} / {az ? 'hədəf' : 'desired'}: {replicas}.
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className="button button-secondary"
          disabled={recovering || rollout > 0}
          onClick={() => {
            setRecovering(true);
            setMessage(
              'Pod deleted: observed state is below desired state. Waiting for reconciliation…',
            );
          }}
        >
          <Trash2 size={15} />
          {t('Delete one Pod')}
        </button>
        <button
          type="button"
          className="button button-primary"
          disabled={recovering || rollout >= replicas * 2}
          onClick={() => {
            const next = rollout + 1;
            setRollout(next);
            setMessage(
              next === replicas * 2
                ? 'Rollout complete: all Pods run v2; the old ReplicaSet is retained at zero replicas.'
                : next % 2
                  ? 'New ReplicaSet adds one ready v2 Pod before an old Pod is removed.'
                  : 'Old ReplicaSet removes one v1 Pod. The desired count remains available.',
            );
          }}
        >
          {t(rollout === 0 ? 'Deploy v2' : rolling ? 'Next rollout step' : 'Rollout complete')}
          <ArrowRight size={15} />
        </button>
      </div>
      <p className={styles.note}>
        {t(
          'Simplified model: each new Pod becomes ready immediately; terminating Pods, scheduling delays and failures are omitted. Real rollouts can stall. Replacing a Pod does not restore its local data.',
        )}
      </p>
    </>
  );
}

function Selectors() {
  const t = useUIText();
  const az = useLocale() === 'az';
  const [namespace, setNamespace] = useState('demo');
  const [app, setApp] = useState('orders');
  const pods = [
    { name: 'orders-a', namespace: 'demo', app: 'orders' },
    { name: 'orders-b', namespace: 'demo', app: 'orders' },
    { name: 'catalog-a', namespace: 'demo', app: 'catalog' },
    { name: 'orders-c', namespace: 'production', app: 'orders' },
  ];
  const matches = pods.filter((pod) => pod.namespace === namespace && pod.app === app);
  return (
    <>
      <div className={styles.controls}>
        <label>
          {t('Service namespace')}
          <select value={namespace} onChange={(e) => setNamespace(e.target.value)}>
            <option>demo</option>
            <option>production</option>
          </select>
        </label>
        <label>
          {t('Service selector')}
          <select value={app} onChange={(e) => setApp(e.target.value)}>
            <option value="orders">app: orders</option>
            <option value="catalog">app: catalog</option>
            <option value="order">app: order ({az ? 'yazılış xətası' : 'typo'})</option>
          </select>
        </label>
      </div>
      <div className={styles.deployment}>
        <Server size={24} />
        <div>
          <strong>Service / storefront</strong>
          <small>
            namespace: {namespace} · selector: app={app}
          </small>
        </div>
      </div>
      <div className={styles.branch}>
        {az
          ? '↓ eyni namespace-də Ready Pod-ları seçir ↓'
          : '↓ selects ready Pods in the same namespace ↓'}
      </div>
      <div className={styles.selectorGrid}>
        {pods.map((pod) => {
          const matched = matches.includes(pod);
          return (
            <div
              key={pod.name}
              className={`${styles.pod} ${matched ? styles.matched : styles.unmatched}`}
            >
              <Container size={23} />
              <strong>{pod.name}</strong>
              <small>namespace: {pod.namespace}</small>
              <small>app: {pod.app}</small>
              <span>{t(matched ? '✓ Selected' : '— Not selected')}</span>
            </div>
          );
        })}
      </div>
      <p className={styles.status} role="status">
        {matches.length}{' '}
        {az
          ? 'uyğun Ready Pod'
          : matches.length === 1
            ? 'matching ready Pod'
            : 'matching ready Pods'}
        .{' '}
        {t(
          matches.length === 0
            ? 'No backends: check spelling and namespace before restarting containers.'
            : 'A matching label alone is insufficient: namespace and readiness also matter.',
        )}
      </p>
      <p className={styles.note}>
        {t(
          'A selector-based Service discovers Pods in its own namespace. Namespaces do not block network traffic by themselves; use RBAC and supported NetworkPolicies for access control.',
        )}
      </p>
    </>
  );
}

function Configuration() {
  const t = useUIText();
  const az = useLocale() === 'az';
  const [config, setConfig] = useState('info');
  const [environment, setEnvironment] = useState('info');
  const [secretVersion, setSecretVersion] = useState(1);
  const [appVersion, setAppVersion] = useState(1);
  return (
    <>
      <div className={styles.configGrid}>
        <div className={styles.configCard}>
          <FileCode2 size={25} />
          <strong>ConfigMap / orders-config</strong>
          <p>{t('Non-confidential configuration')}</p>
          <label>
            LOG_LEVEL
            <select value={config} onChange={(e) => setConfig(e.target.value)}>
              <option>info</option>
              <option>debug</option>
              <option>warn</option>
            </select>
          </label>
          <small>{t('Consumed as an environment variable')}</small>
        </div>
        <div className={styles.configCard}>
          <KeyRound size={25} />
          <strong>{t('Vault → Agent → shared file')}</strong>
          <p>{t('Credentials under a scoped policy')}</p>
          <span className={styles.chip}>
            {az ? 'Fayldakı credential versiyası' : 'Rendered credential: version'} {secretVersion}
          </span>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setSecretVersion((v) => v + 1)}
          >
            {t('Simulate secret rotation')}
          </button>
          <small>{t('Agent has fetched a new credential')}</small>
        </div>
      </div>
      <div className={styles.deployment}>
        <Container size={24} />
        <div>
          <strong>{t('Application process')}</strong>
          <small>
            {az ? 'Environment daxilində LOG_LEVEL' : 'Environment LOG_LEVEL'}: {environment}
          </small>
          <small>
            {az ? 'Oxunmuş credential versiyası' : 'Loaded credential: version'} {appVersion}
          </small>
        </div>
        <ShieldCheck size={22} />
      </div>
      <p className={styles.status} role="status">
        {t(
          config !== environment
            ? 'ConfigMap changed. Existing environment variables keep their old value until the Pod is replaced.'
            : 'Environment matches the ConfigMap snapshot.',
        )}{' '}
        {t(
          secretVersion !== appVersion
            ? 'Agent updated the file; the application still needs to reload it.'
            : 'Application has loaded the current credential file.',
        )}
      </p>
      <div className={styles.actions}>
        <button
          type="button"
          className="button button-secondary"
          disabled={config === environment}
          onClick={() => {
            setEnvironment(config);
            setAppVersion(secretVersion);
          }}
        >
          {t('Recreate Pod for config')}
        </button>
        <button
          type="button"
          className="button button-primary"
          disabled={secretVersion === appVersion}
          onClick={() => setAppVersion(secretVersion)}
        >
          {t('Reload credential file')}
        </button>
      </div>
      <p className={styles.note}>
        {t(
          'Rotation is simulated: real Agent refresh depends on secret type and configuration. File updates do not automatically update application memory or existing database connections. ConfigMaps provide no secrecy; base64 in a Kubernetes Secret is encoding, not encryption.',
        )}
      </p>
    </>
  );
}
