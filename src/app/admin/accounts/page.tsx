'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, UserRole } from '@/store/authStore';
import { supabase } from '@/lib/supabaseClient';
import type { Tables } from '@/lib/supabase.types';
import { Download, Upload, RefreshCw } from 'lucide-react';

type ProfileRow = Tables<'profiles'>;

const emptyForm = {
  id: '',
  name: '',
  role: 'user' as UserRole,
  active: true,
};

export default function AccountManagementPage() {
  const router = useRouter();
  const { session, apiKeys, setApiKeys } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commonKeyInput, setCommonKeyInput] = useState('');
  const [copyKeyInput, setCopyKeyInput] = useState('');
  const [designKeyInput, setDesignKeyInput] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);

  const sharedApi = apiKeys.shared || {};
  const copyApi = apiKeys.copy || {};
  const designApi = apiKeys.design || {};
  const useSharedForCopy = apiKeys.useSharedForCopy ?? true;
  const useSharedForDesign = apiKeys.useSharedForDesign ?? true;

  useEffect(() => {
    const authPersist = useAuthStore.persist;
    const unsub = authPersist?.onFinishHydration?.(() => setHydrated(true));
    setHydrated(authPersist?.hasHydrated?.() ?? false);
    return () => unsub?.();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace('/login');
      return;
    }
    if (session.role !== 'admin') {
      router.replace('/');
      return;
    }
    fetchProfiles();
  }, [hydrated, session, router]);

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch('/api/admin/users', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      setError('프로필 목록을 불러오지 못했습니다.');
      setLoading(false);
      return;
    }
    const json = await res.json();
    setProfiles(json.data || []);
    setLoading(false);
  };

  const toggleCopyUseShared = (checked: boolean) => {
    if (checked) {
      setApiKeys({ useSharedForCopy: true });
      return;
    }
    setApiKeys({
      useSharedForCopy: false,
      copy: { ...sharedApi, ...copyApi },
    });
  };

  const toggleDesignUseShared = (checked: boolean) => {
    if (checked) {
      setApiKeys({ useSharedForDesign: true });
      return;
    }
    setApiKeys({
      useSharedForDesign: false,
      design: { ...sharedApi, ...designApi },
    });
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const method = form.id ? 'PUT' : 'POST';
    const res = await fetch('/api/admin/users', {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        id: form.id || undefined,
        name: form.name,
        role: form.role,
        active: form.active,
        mustChangePassword: true,
      }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || '저장에 실패했습니다.');
      return;
    }

    setMessage(form.id ? '사용자 정보를 수정했습니다.' : '새 사용자를 추가했습니다.');
    resetForm();
    fetchProfiles();
  };

  const onEdit = (user: ProfileRow) => {
    setForm({
      id: user.id,
      name: user.name,
      role: user.role as UserRole,
      active: user.active,
    });
    setMessage(null);
  };

  const toggleActive = async (user: ProfileRow) => {
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        id: user.id,
        active: !user.active,
      }),
    });
    if (!res.ok) {
      setError('상태 변경에 실패했습니다.');
      return;
    }
    fetchProfiles();
  };

  const downloadSampleCsv = () => {
    const header = 'name,role,active\n';
    const sample = [
      '홍길동,admin,true',
      '일반유저,user,true',
    ].join('\n');
    const blob = new Blob([header + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    setMessage(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const [header, ...rows] = lines;
      const cols = header.split(',').map((c) => c.trim());
      if (!(cols[0] === 'name' && cols[1] === 'role' && cols[2] === 'active')) {
        setError('CSV 헤더는 name,role,active 순이어야 합니다.');
        setUploading(false);
        return;
      }

      const payload = rows.map((line) => {
        const [name, role, active] = line.split(',').map((v) => v.trim());
        return { name, role: role as UserRole, active: active === 'true' };
      });

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ users: payload }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || 'CSV 업로드에 실패했습니다.');
        setUploading(false);
        return;
      }
      setMessage('CSV 업로드가 완료되었습니다.');
      setShowUpload(false);
      fetchProfiles();
    } catch {
      setError('CSV 파싱에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const sortedUsers = useMemo(
    () => [...profiles].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [profiles]
  );

  if (!hydrated || !session || session.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-zinc-500">
        접근 권한을 확인하는 중입니다...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto py-6 px-6">
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl border border-zinc-200 p-4 w-[380px] space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">CSV 업로드</h3>
                <button className="text-xs text-zinc-500 hover:text-zinc-700" onClick={() => setShowUpload(false)}>
                  닫기
                </button>
              </div>
              <p className="text-xs text-zinc-600">헤더: name,role,active (role: admin/user, active: true/false)</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadSampleCsv}
                  className="px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> 샘플 CSV 다운로드
                </button>
                <label className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> 파일 선택
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCsvUpload(file);
                    }}
                  />
                </label>
              </div>
              {uploading && <div className="text-xs text-blue-600">업로드 중...</div>}
              {error && <div className="text-xs text-red-600">{error}</div>}
              {message && <div className="text-xs text-green-600">{message}</div>}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">운영 설정</h1>
            <p className="text-xs text-zinc-500">계정 및 LLM API를 관리합니다. 모든 신규 계정의 초기 비밀번호는 000000입니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowApiSettings(!showApiSettings)}
              className="px-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 text-zinc-700 font-medium"
            >
              {showApiSettings ? 'API 관리 닫기' : 'API 관리'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
            >
              ← 메인으로
            </button>
          </div>
        </div>

        {/* API 관리 (토글 가능) */}
        {showApiSettings && (
          <div className="bg-white rounded-xl shadow border border-zinc-200 p-4 mb-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-900 mb-1">LLM / API 설정</h2>
                <p className="text-xs text-zinc-500">
                  강의계획서 문구 추천과 디자인 분석에 사용할 API를 공통 또는 분리해서 설정합니다. (브라우저 로컬 저장)
                </p>
              </div>
              <div className="text-[10px] text-zinc-500 bg-zinc-100 border border-zinc-200 rounded-md px-2 py-1">
                공통 설정이 비어 있으면 기능별 설정만 사용합니다.
              </div>
            </div>

            {/* 공통 설정 */}
            <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">공통 기본 설정</h3>
                  <p className="text-[11px] text-zinc-500">두 기능 모두에 기본으로 적용됩니다.</p>
                </div>
                <span className="text-[10px] text-zinc-400">선택 입력</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-800 mb-1">Base URL</label>
                  <input
                    type="text"
                    value={sharedApi.baseUrl || ''}
                    onChange={(e) => setApiKeys({ shared: { ...sharedApi, baseUrl: e.target.value } })}
                    placeholder="예) https://api.openai.com/v1"
                    className="w-full text-xs rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-800 mb-1">Model</label>
                  <input
                    type="text"
                    value={sharedApi.model || ''}
                    onChange={(e) => setApiKeys({ shared: { ...sharedApi, model: e.target.value } })}
                    placeholder="예) gpt-4o-mini"
                    className="w-full text-xs rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-zinc-800 mb-1">API Key</label>
                  <input
                    type="password"
                    value={commonKeyInput}
                    onFocus={() => setCommonKeyInput('')}
                    onBlur={() => setCommonKeyInput('')}
                    onChange={(e) => {
                      setCommonKeyInput(e.target.value);
                      setApiKeys({ shared: { ...sharedApi, key: e.target.value } });
                    }}
                    placeholder={sharedApi.key ? '****** 저장됨 (수정 시 새 값 입력)' : 'sk-...'}
                    className="w-full text-xs rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {sharedApi.key ? (
                    <div className="text-[10px] text-green-600 mt-1">키가 저장되어 있습니다.</div>
                  ) : (
                    <div className="text-[10px] text-zinc-500 mt-1">아직 저장된 키가 없습니다.</div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-zinc-500">※ 입력값은 브라우저 로컬스토리지에만 저장됩니다.</p>
            </div>

            {/* 기능별 설정 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border border-zinc-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">강의계획서 문구 추천</h3>
                    <p className="text-[11px] text-zinc-500">템플릿 문구/카피 자동 생성에 사용</p>
                  </div>
                  <label className="flex items-center gap-1 text-[11px] text-zinc-600">
                    <input
                      type="checkbox"
                      checked={useSharedForCopy}
                      onChange={(e) => toggleCopyUseShared(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border border-zinc-300"
                    />
                    공통 설정 사용
                  </label>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-800 mb-1">Base URL</label>
                    <input
                      type="text"
                      value={useSharedForCopy ? sharedApi.baseUrl || '' : copyApi.baseUrl || ''}
                      onChange={(e) => setApiKeys({ copy: { ...copyApi, baseUrl: e.target.value } })}
                      placeholder={useSharedForCopy ? '공통 설정을 사용합니다' : '예) https://api.openai.com/v1'}
                      disabled={useSharedForCopy}
                      className="w-full text-xs rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-800 mb-1">Model</label>
                    <input
                      type="text"
                      value={useSharedForCopy ? sharedApi.model || '' : copyApi.model || ''}
                      onChange={(e) => setApiKeys({ copy: { ...copyApi, model: e.target.value } })}
                      placeholder={useSharedForCopy ? '공통 설정을 사용합니다' : '예) gpt-4o-mini'}
                      disabled={useSharedForCopy}
                      className="w-full text-xs rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-800 mb-1">API Key</label>
                    <input
                      type="password"
                      value={copyKeyInput}
                      onFocus={() => setCopyKeyInput('')}
                      onBlur={() => setCopyKeyInput('')}
                      onChange={(e) => {
                        setCopyKeyInput(e.target.value);
                        setApiKeys({ copy: { ...copyApi, key: e.target.value } });
                      }}
                      placeholder={useSharedForCopy
                        ? sharedApi.key ? '공통 키 사용 중' : '공통 키를 먼저 입력하세요'
                        : copyApi.key ? '****** 저장됨 (수정 시 새 값 입력)' : 'sk-...'}
                      disabled={useSharedForCopy}
                      className="w-full text-xs rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-400"
                    />
                    {useSharedForCopy ? (
                      <div className="text-[10px] text-zinc-500 mt-1">공통 설정을 그대로 사용합니다.</div>
                    ) : copyApi.key ? (
                      <div className="text-[10px] text-green-600 mt-1">키가 저장되어 있습니다.</div>
                    ) : (
                      <div className="text-[10px] text-zinc-500 mt-1">아직 저장된 키가 없습니다.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border border-zinc-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">디자인 분석</h3>
                    <p className="text-[11px] text-zinc-500">디자인 진단/추천 API를 별도로 지정할 수 있습니다.</p>
                  </div>
                  <label className="flex items-center gap-1 text-[11px] text-zinc-600">
                    <input
                      type="checkbox"
                      checked={useSharedForDesign}
                      onChange={(e) => toggleDesignUseShared(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border border-zinc-300"
                    />
                    공통 설정 사용
                  </label>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-800 mb-1">Base URL</label>
                    <input
                      type="text"
                      value={useSharedForDesign ? sharedApi.baseUrl || '' : designApi.baseUrl || ''}
                      onChange={(e) => setApiKeys({ design: { ...designApi, baseUrl: e.target.value } })}
                      placeholder={useSharedForDesign ? '공통 설정을 사용합니다' : '예) https://api.openai.com/v1'}
                      disabled={useSharedForDesign}
                      className="w-full text-xs rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-800 mb-1">Model</label>
                    <input
                      type="text"
                      value={useSharedForDesign ? sharedApi.model || '' : designApi.model || ''}
                      onChange={(e) => setApiKeys({ design: { ...designApi, model: e.target.value } })}
                      placeholder={useSharedForDesign ? '공통 설정을 사용합니다' : '예) gpt-4o-mini'}
                      disabled={useSharedForDesign}
                      className="w-full text-xs rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-800 mb-1">API Key</label>
                    <input
                      type="password"
                      value={designKeyInput}
                      onFocus={() => setDesignKeyInput('')}
                      onBlur={() => setDesignKeyInput('')}
                      onChange={(e) => {
                        setDesignKeyInput(e.target.value);
                        setApiKeys({ design: { ...designApi, key: e.target.value } });
                      }}
                      placeholder={useSharedForDesign
                        ? sharedApi.key ? '공통 키 사용 중' : '공통 키를 먼저 입력하세요'
                        : designApi.key ? '****** 저장됨 (수정 시 새 값 입력)' : 'sk-...'}
                      disabled={useSharedForDesign}
                      className="w-full text-xs rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-100 disabled:text-zinc-400"
                    />
                    {useSharedForDesign ? (
                      <div className="text-[10px] text-zinc-500 mt-1">공통 설정을 그대로 사용합니다.</div>
                    ) : designApi.key ? (
                      <div className="text-[10px] text-green-600 mt-1">키가 저장되어 있습니다.</div>
                    ) : (
                      <div className="text-[10px] text-zinc-500 mt-1">아직 저장된 키가 없습니다.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 사용자 관리 (메인) */}
        <div className="bg-white rounded-xl shadow border border-zinc-200 p-4">
          <h2 className="text-base font-semibold text-zinc-900 mb-1">사용자 관리</h2>
          <p className="text-xs text-zinc-500 mb-3">사용자 계정을 추가, 수정, 삭제하고 CSV로 일괄 등록할 수 있습니다.</p>
          
          {/* 버튼 영역 */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={fetchProfiles}
              className="px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 flex items-center gap-1 text-zinc-700"
              disabled={loading}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              새로고침
            </button>
            <button
              onClick={downloadSampleCsv}
              className="px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg hover:bg-zinc-100 flex items-center gap-1 text-zinc-700"
            >
              <Download className="w-3.5 h-3.5" />
              샘플 CSV
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
            >
              <Upload className="w-3.5 h-3.5" />
              CSV 업로드
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                {form.id ? '사용자 수정' : '새 사용자 추가'}
              </h3>
              <form className="space-y-3" onSubmit={onSubmit}>
                <div>
                  <label className="block text-xs font-medium text-zinc-800 mb-1">이름 (ID)</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full text-xs rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="예) 홍길동"
                    required
                  />
                </div>
                {/* 휴대폰 뒷자리 필드를 제거하고 초기 비밀번호 정책만 안내 */}
                <div>
                  <label className="block text-xs font-medium text-zinc-800 mb-1">초기 비밀번호</label>
                  <div className="text-xs text-zinc-600 bg-zinc-100 border border-zinc-200 rounded-lg px-2.5 py-1.5">
                    모든 신규 계정은 <span className="font-semibold text-blue-700">000000</span> 으로 생성되며, 첫 로그인 시 숫자 6자리로 변경합니다.
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-800 mb-1">권한</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                    className="w-full text-xs rounded-lg border border-zinc-300 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">일반유저</option>
                    <option value="admin">관리자</option>
                  </select>
                </div>
                {form.id && (
                  <div className="flex items-center space-x-2">
                    <input
                      id="active"
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="h-3.5 w-3.5 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="active" className="text-xs text-zinc-700">활성화</label>
                  </div>
                )}
                {message && (
                  <div className="text-[10px] text-green-700 bg-green-50 border border-green-200 rounded-md px-2.5 py-1.5">
                    {message}
                  </div>
                )}
                {error && (
                  <div className="text-[10px] text-red-700 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5">
                    {error}
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 rounded-lg transition"
                    disabled={loading}
                  >
                    {form.id ? '정보 수정' : '계정 생성'}
                  </button>
                  {form.id && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-2.5 py-1.5 text-xs text-zinc-600 hover:text-zinc-800"
                    >
                      새로 만들기
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-900">등록된 사용자</h3>
                <span className="text-[10px] text-zinc-500">총 {profiles.length}명</span>
              </div>
              {loading ? (
                <div className="text-xs text-zinc-500">불러오는 중...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-zinc-500">
                        <th className="px-2 py-1.5">이름(ID)</th>
                        <th className="px-2 py-1.5">권한</th>
                        <th className="px-2 py-1.5">상태</th>
                        <th className="px-2 py-1.5">수정</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUsers.map((user) => (
                        <tr key={user.id} className="border-t border-zinc-100">
                          <td className="px-2 py-1.5">{user.name}</td>
                          <td className="px-2 py-1.5">
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                              user.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {user.role === 'admin' ? '관리자' : '일반'}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              onClick={() => toggleActive(user)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition ${
                                user.active
                                  ? 'bg-green-50 text-green-700 border border-green-200'
                                  : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                              }`}
                            >
                              {user.active ? '활성' : '비활성'}
                            </button>
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              onClick={() => onEdit(user)}
                              className="text-blue-600 hover:text-blue-800 font-semibold text-[10px]"
                            >
                              편집
                            </button>
                          </td>
                        </tr>
                      ))}
                      {sortedUsers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center text-zinc-400 py-4">
                            등록된 사용자가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

