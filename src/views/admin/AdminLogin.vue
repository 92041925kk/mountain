<template>
  <div class="admin-login-page">
    <div class="login-card">
      <div class="login-logo">🏔️</div>
      <h1>開發者登入</h1>
      <p class="login-sub">中原大學登山社後台</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="your@email.com"
            autocomplete="username"
            required
          />
        </div>
        <div class="form-group">
          <label>密碼</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <p class="error-msg" v-if="errorMsg">{{ errorMsg }}</p>

        <button type="submit" class="btn-login" :disabled="isLoading">
          {{ isLoading ? '登入中...' : '登入' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from '#app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, authPersistenceReady } from '../../firebase';

const router = useRouter();
const route = useRoute();
const email = ref('');
const password = ref('');
const errorMsg = ref('');
const isLoading = ref(false);

function getRedirectTarget() {
  const redirect = Array.isArray(route.query.redirect)
    ? route.query.redirect[0]
    : route.query.redirect;

  return typeof redirect === 'string' && redirect.startsWith('/cymc-admin') && redirect !== '/cymc-admin'
    ? redirect
    : '/cymc-admin/dashboard';
}

async function handleLogin() {
  errorMsg.value = '';
  isLoading.value = true;
  try {
    await authPersistenceReady;
    const credential = await signInWithEmailAndPassword(auth, email.value.trim(), password.value);

    if (!credential.user) {
      throw new Error('Firebase did not return a signed-in user.');
    }

    await router.replace(getRedirectTarget());
  } catch (err) {
    console.error('Admin login failed:', err);
    switch (err.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        errorMsg.value = 'Email 或密碼錯誤';
        break;
      case 'auth/too-many-requests':
        errorMsg.value = '嘗試次數過多，請稍後再試';
        break;
      case 'auth/unauthorized-domain':
        errorMsg.value = '目前網址尚未加入 Firebase 授權網域';
        break;
      case 'auth/network-request-failed':
        errorMsg.value = '網路連線失敗，請確認連線後再試';
        break;
      default:
        errorMsg.value = err.code ? `登入失敗：${err.code}` : '登入失敗，請稍後再試';
    }
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.admin-login-page {
  box-sizing: border-box;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f5f1;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-sizing: border-box;
  padding: 48px 40px;
  width: min(400px, calc(100vw - 48px));
  max-width: 400px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
}

@media (max-width: 600px) {
  .admin-login-page {
    padding: 24px;
  }

  .login-card {
    width: min(100%, 300px);
    padding: 40px 28px;
  }
}

.login-logo {
  font-size: 3rem;
  margin-bottom: 12px;
}

.login-card h1 {
  color: #1A432D;
  font-size: 1.6rem;
  margin-bottom: 6px;
}

.login-sub {
  color: #888;
  font-size: 0.9rem;
  margin-bottom: 32px;
}

.form-group {
  text-align: left;
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 6px;
  font-weight: 600;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #1A432D;
}

.error-msg {
  color: #c0392b;
  font-size: 0.88rem;
  margin-bottom: 12px;
  text-align: left;
}

.btn-login {
  width: 100%;
  padding: 12px;
  background-color: #1A432D;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-login:hover:not(:disabled) {
  background-color: #245c3d;
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
