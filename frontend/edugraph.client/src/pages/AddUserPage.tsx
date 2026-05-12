// src/pages/AddUserPage.tsx
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { DarkInput, DarkLabel, Field, PrimaryButton, DarkRadio } from '../components/ui';
import { C, F } from '../styles/tokens';

const NAV_LINKS = [
    { label: 'Заявки', href: '/admin/sign-up-applications' },
    { label: 'Додати користувача', href: '/admin/add-user' },
];

// ── Tab button ─────────────────────────────────────────────────────────────────
const Tab: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        style={{
            width: '100%',
            minHeight: '44px',
            minWidth: '44px',
            padding: '8px 16px',
            borderRadius: '8px',
            fontFamily: F.sans,
            fontSize: '0.85rem',
            fontWeight: active ? 500 : 400,
            color: active ? C.accent : C.textMuted,
            background: active ? C.accentDim : 'transparent',
            border: `1px solid ${active ? C.accentBorder : 'transparent'}`,
            cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = C.textPrimary; }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = C.textMuted; }}
    >
        {children}
    </button>
);

// ── Manual form placeholder ───────────────────────────────────────────────────
const ManualForm: React.FC = () => {
    const [userType, setUserType] = React.useState<'Student' | 'Teacher'>('Student');

    const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setUserType(e.target.value as 'Student' | 'Teacher');

    return (
        <form onSubmit={(e) => e.preventDefault()}>
            <Field>
                <DarkLabel htmlFor="login">Логін</DarkLabel>
                <DarkInput id="login" name="login" type="text" placeholder="your_login" />
            </Field>

            <Field>
                <DarkLabel htmlFor="fullName">ПІБ</DarkLabel>
                <DarkInput id="fullName" name="fullName" type="text" placeholder="Іванов Іван Іванович" />
            </Field>

            <Field>
                <DarkLabel htmlFor="password">Пароль</DarkLabel>
                <DarkInput id="password" name="password" type="password" placeholder="••••••••" />
            </Field>

            <Field>
                <DarkLabel>Роль</DarkLabel>
                <div className="flex flex-col gap-1 md:flex-row md:gap-5" style={{ padding: '10px 14px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px' }}>
                    <DarkRadio id="mStudent" name="mUserType" value="Student" checked={userType === 'Student'} onChange={handleTypeChange} label="Студент" />
                    <DarkRadio id="mTeacher" name="mUserType" value="Teacher" checked={userType === 'Teacher'} onChange={handleTypeChange} label="Викладач" />
                </div>
            </Field>

            {userType === 'Student' && (
                <Field>
                    <DarkLabel htmlFor="group">Група</DarkLabel>
                    <DarkInput id="group" name="group" type="text" placeholder="ІО-21" />
                </Field>
            )}

            <PrimaryButton type="submit" full>Створити користувача</PrimaryButton>
        </form>
    );
};

// ── CSV tab placeholder ───────────────────────────────────────────────────────
const CsvForm: React.FC = () => (
    <div>
        {/* Drop zone */}
        <div
            className="px-5 py-8 md:px-8 md:py-12"
            style={{
                border: `2px dashed ${C.border}`,
                borderRadius: '14px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = C.borderHi;
                e.currentTarget.style.background = 'rgba(79,255,176,0.03)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.background = 'transparent';
            }}
        >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 12px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ fontFamily: F.sans, fontSize: '0.88rem', color: C.textMuted, margin: '0 0 6px' }}>
                Перетягніть CSV файл або{' '}
                <span style={{ color: C.accent, cursor: 'pointer' }}>оберіть з комп'ютера</span>
            </p>
            <p style={{ fontFamily: F.sans, fontSize: '0.74rem', color: C.textMuted, opacity: 0.6, margin: 0 }}>
                Очікуваний формат: login, fullName, userType, group
            </p>
        </div>

        {/* Expected columns hint */}
        <div style={{ marginTop: '20px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '14px 18px', overflowX: 'auto' }}>
            <p style={{ fontFamily: F.sans, fontSize: '0.75rem', color: C.textMuted, margin: '0 0 8px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Приклад рядка CSV
            </p>
            <code style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.875rem', color: '#67e8f9', whiteSpace: 'nowrap' }}>
                ivan_petrenko,Петренко Іван Олегович,Student,ІО-21
            </code>
        </div>

        <PrimaryButton full style={{ marginTop: '20px' }} disabled>
            Імпортувати
        </PrimaryButton>
    </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────
export const AddUserPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const currentType = (searchParams.get('type') || 'custom') as 'custom' | 'csv';

    return (
        <Layout navLinks={NAV_LINKS}>
            <div className="mx-auto w-full max-w-[480px] pt-6 md:pt-9">

                {/* Heading */}
                <div style={{ marginBottom: '28px' }}>
                    <p style={{ fontFamily: F.display, fontSize: '0.7rem', letterSpacing: '0.15em', color: 'rgba(79,255,176,0.5)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        Адміністрування
                    </p>
                    <h1 style={{ fontFamily: F.display, fontSize: 'clamp(1.35rem, 5vw, 1.6rem)', fontWeight: 700, color: C.textPrimary, margin: 0 }}>
                        Додати користувача
                    </h1>
                </div>

                {/* Tab switcher */}
                <div className="grid w-full grid-cols-2 gap-2 md:w-fit" style={{ marginBottom: '28px', padding: '5px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: '11px' }}>
                    <Tab active={currentType === 'custom'} onClick={() => setSearchParams({ type: 'custom' })}>
                        Вручну
                    </Tab>
                    <Tab active={currentType === 'csv'} onClick={() => setSearchParams({ type: 'csv' })}>
                        Таблиця CSV
                    </Tab>
                </div>

                {/* Card */}
                <div className="px-5 py-6 md:px-7 md:py-8" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: '16px' }}>
                    {currentType === 'custom' ? <ManualForm /> : <CsvForm />}
                </div>
            </div>
        </Layout>
    );
};
