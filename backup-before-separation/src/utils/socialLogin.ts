// 카카오톡/네이버 소셜 로그인 유틸리티

interface SocialLoginConfig {
  kakao: {
    appKey: string;
    redirectUri: string;
  };
  naver: {
    clientId: string;
    redirectUri: string;
  };
}

interface SocialUserInfo {
  id: string;
  email?: string;
  name: string;
  profileImage?: string;
  provider: 'kakao' | 'naver';
}

// 소셜 로그인 설정
const socialConfig: SocialLoginConfig = {
  kakao: {
    appKey: import.meta.env.VITE_KAKAO_APP_KEY || '',
    redirectUri: `${window.location.origin}/auth/kakao/callback`
  },
  naver: {
    clientId: import.meta.env.VITE_NAVER_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/naver/callback`
  }
};

// 카카오 SDK 초기화
const initializeKakaoSDK = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Kakao) {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(socialConfig.kakao.appKey);
      }
      resolve();
    } else {
      // 카카오 SDK 로드
      const script = document.createElement('script');
      script.src = 'https://developers.kakao.com/sdk/js/kakao.js';
      script.onload = () => {
        if (window.Kakao) {
          window.Kakao.init(socialConfig.kakao.appKey);
          resolve();
        } else {
          reject(new Error('카카오 SDK 로드 실패'));
        }
      };
      script.onerror = () => reject(new Error('카카오 SDK 로드 실패'));
      document.head.appendChild(script);
    }
  });
};

// 카카오 로그인
export const kakaoLogin = async (): Promise<SocialUserInfo> => {
  try {
    await initializeKakaoSDK();
    
    return new Promise((resolve, reject) => {
      window.Kakao.Auth.login({
        success: async (authObj: any) => {
          try {
            // 사용자 정보 가져오기
            window.Kakao.API.request({
              url: '/v2/user/me',
              success: (res: any) => {
                const userInfo: SocialUserInfo = {
                  id: res.id.toString(),
                  email: res.kakao_account?.email,
                  name: res.properties?.nickname || '카카오 사용자',
                  profileImage: res.properties?.profile_image,
                  provider: 'kakao'
                };
                resolve(userInfo);
              },
              fail: (err: any) => {
                reject(new Error('카카오 사용자 정보 조회 실패: ' + err.error_msg));
              }
            });
          } catch (error) {
            reject(error);
          }
        },
        fail: (err: any) => {
          reject(new Error('카카오 로그인 실패: ' + err.error_msg));
        }
      });
    });
  } catch (error) {
    throw new Error('카카오 SDK 초기화 실패: ' + error);
  }
};

// 네이버 로그인
export const naverLogin = async (): Promise<SocialUserInfo> => {
  try {
    // 네이버 로그인은 팝업 방식으로 구현
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${socialConfig.naver.clientId}&redirect_uri=${encodeURIComponent(socialConfig.naver.redirectUri)}&state=${Math.random().toString(36).substr(2, 11)}`;
    
    const popup = window.open(naverAuthUrl, 'naverLogin', 'width=500,height=600,scrollbars=yes,resizable=yes');
    
    return new Promise((resolve, reject) => {
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          reject(new Error('네이버 로그인이 취소되었습니다.'));
        }
      }, 1000);
      
      // 메시지 리스너로 로그인 결과 받기
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'NAVER_LOGIN_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup?.close();
          resolve(event.data.userInfo);
        } else if (event.data.type === 'NAVER_LOGIN_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup?.close();
          reject(new Error(event.data.error));
        }
      };
      
      window.addEventListener('message', messageListener);
    });
  } catch (error) {
    throw new Error('네이버 로그인 실패: ' + error);
  }
};

// 소셜 로그인 상태 확인
export const checkSocialLoginStatus = async (provider: 'kakao' | 'naver'): Promise<boolean> => {
  try {
    if (provider === 'kakao') {
      await initializeKakaoSDK();
      return window.Kakao.Auth.getAccessToken() !== null;
    }
    return false;
  } catch (error) {
    console.error(`${provider} 로그인 상태 확인 실패:`, error);
    return false;
  }
};

// 소셜 로그아웃
export const socialLogout = async (provider: 'kakao' | 'naver'): Promise<void> => {
  try {
    if (provider === 'kakao') {
      await initializeKakaoSDK();
      if (window.Kakao.Auth.getAccessToken()) {
        window.Kakao.Auth.logout();
      }
    }
  } catch (error) {
    console.error(`${provider} 로그아웃 실패:`, error);
    throw error;
  }
};

// 타입 선언
declare global {
  interface Window {
    Kakao: any;
  }
} 