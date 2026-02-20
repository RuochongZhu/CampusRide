import axios from 'axios';

let cachedToken = null;
let tokenExpireAt = 0;

const DEFAULT_WEBVIEW_PATH = 'pages/index';

const getAppConfig = () => {
  const appId = process.env.WECHAT_APPID;
  const appSecret = process.env.WECHAT_APPSECRET;
  return { appId, appSecret };
};

const getWebviewConfig = () => {
  const path = process.env.WECHAT_MINI_WEBVIEW_PATH || DEFAULT_WEBVIEW_PATH;
  const queryKey = process.env.WECHAT_MINI_WEBVIEW_QUERY_KEY || '';
  const envVersion = process.env.WECHAT_MINI_ENV_VERSION || 'release';
  return { path, queryKey, envVersion };
};

const getAccessToken = async () => {
  const now = Date.now();
  if (cachedToken && now < tokenExpireAt) {
    return cachedToken;
  }

  const { appId, appSecret } = getAppConfig();
  if (!appId || !appSecret) {
    throw new Error('Missing WeChat Mini Program config');
  }

  const url = 'https://api.weixin.qq.com/cgi-bin/token';
  const { data } = await axios.get(url, {
    params: {
      grant_type: 'client_credential',
      appid: appId,
      secret: appSecret
    },
    timeout: 10000
  });

  if (!data?.access_token) {
    throw new Error(`Failed to fetch WeChat token: ${JSON.stringify(data)}`);
  }

  cachedToken = data.access_token;
  const expiresIn = Number(data.expires_in || 7200);
  tokenExpireAt = now + Math.max(0, (expiresIn - 120) * 1000);
  return cachedToken;
};

const buildQuery = (targetUrl) => {
  const { queryKey } = getWebviewConfig();
  if (!queryKey) return '';
  return `${queryKey}=${encodeURIComponent(targetUrl)}`;
};

const generateMiniProgramShortLink = async (targetUrl) => {
  const accessToken = await getAccessToken();
  const { path, envVersion } = getWebviewConfig();

  const api = `https://api.weixin.qq.com/wxa/generate_short_link?access_token=${accessToken}`;
  const payload = {
    page_url: path,
    page_url_query: '',
    env_version: envVersion,
    is_permanent: true
  };
  const query = buildQuery(targetUrl);
  if (query) {
    payload.page_url_query = query;
  }

  const { data } = await axios.post(api, payload, { timeout: 10000 });
  if (data?.errcode !== 0 || !data?.short_link) {
    throw new Error(`Failed to generate WeChat short link: ${JSON.stringify(data)}`);
  }
  return data.short_link;
};

const getBestNoticeLink = async (h5Url) => {
  try {
    return await generateMiniProgramShortLink(h5Url);
  } catch (error) {
    console.warn('WeChat short link generation failed, fallback to H5:', error.message);
    return h5Url;
  }
};

export default {
  getBestNoticeLink,
  generateMiniProgramShortLink
};
