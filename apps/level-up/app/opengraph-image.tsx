import { ImageResponse } from 'next/og';
export const alt = 'Mərhələ — BA & PO learning';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#f5f7f5',
        display: 'flex',
        flexDirection: 'column',
        padding: '90px',
        fontFamily: 'sans-serif',
        color: '#29382f',
      }}
    >
      <div style={{ display: 'flex', fontSize: 38, fontWeight: 800, color: '#0f766e' }}>
        Mərhələ
      </div>
      <div
        style={{ display: 'flex', fontSize: 76, fontWeight: 800, marginTop: 60, lineHeight: 1.15 }}
      >
        Business Analysis
        <br />
        &amp; Product Ownership
      </div>
      <div style={{ display: 'flex', fontSize: 26, color: '#6e756d', marginTop: 45 }}>
        Lessons · Learning roadmaps · Certification practice
      </div>
    </div>,
    size,
  );
}
