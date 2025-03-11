'use client';
import {useState} from "react";
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';

export default function Login() {
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');

  const handleAlert = async () => {
    alert(111)
  }
  const handleRegister = async () => {
    try {
      const optionsResponse = await fetch(`/api/register?username=${username}`, {
        method: 'GET',
      });
      const options = await optionsResponse.json();

      const credential = await startRegistration(options);

      const verifyResponse = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        setMessage('注册成功！');
      } else {
        setMessage('注册失败！');
      }
    } catch (error) {
      setMessage(`注册失败：${error.message}`);
    }
  };

  const handleLogin = async () => {
    try {
      // 获取登录选项
      const optionsResponse = await fetch('/api/login', {
        method: 'GET',
      });
      const options = await optionsResponse.json();

      // 开始登录
      const credential = await startAuthentication(options);

      // 验证登录凭证
      const verifyResponse = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        setMessage('登录成功！');
      } else {
        setMessage('登录失败！');
      }
    } catch (error) {
      setMessage(`登录失败：${error.message}`);
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <main className="flex flex-col gap-8 row-start-2">
        {message}
        <div className="flex justify-center items-center">
          <div className="">username: &nbsp;&nbsp;</div><input className="h-10 border rounded" value={username} onChange={(e) => setUsername(e.target.value)}/>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            className="hover:cursor-pointer rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            onClick={handleRegister}
          >
            Register
          </button>
          <button
            className="hover:cursor-pointer rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
            onClick={handleLogin}
          >
            Login
          </button>
        </div>
      </main>
    </div>
  );
}
