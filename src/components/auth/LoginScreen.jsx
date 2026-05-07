import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function LoginScreen() {
  const { login, redirectError } = useAuth()
  const [errMsg, setErrMsg] = useState('')

  const handleLogin = async () => {
    setErrMsg('')
    try {
      await login()
    } catch (err) {
      setErrMsg(err?.code + ': ' + err?.message)
    }
  }

  return (
    <div className="min-h-screen bg-cloud-white flex flex-col items-center justify-center px-5">
      <div className="text-center mb-12">
        <div className="text-5xl mb-6">🗺️</div>
        <h1 className="text-3xl font-medium text-graphite tracking-tight">ZenTravel</h1>
        <p className="mt-2 text-sm text-graphite-soft">旅行時不必手忙腳亂找行程。</p>
      </div>

      <button
        onClick={handleLogin}
        className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-divider bg-white hover:border-morandi-blue/40 hover:shadow-zen-lg transition-all duration-200 text-sm text-graphite font-medium"
      >
        <GoogleIcon />
        使用 Google 帳號登入
      </button>

      {(errMsg || redirectError) && (
        <p className="mt-4 text-xs text-red-500 text-center max-w-xs break-all">{errMsg || redirectError}</p>
      )}

      <p className="mt-8 text-xs text-graphite-soft/60 text-center max-w-xs">
        登入後你的旅程將安全儲存在雲端，並可邀請同行的人一起查看。
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
