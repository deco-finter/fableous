const keyNamespace = "fableous";

const getKey = (key: string) => `${keyNamespace}.${key}`;

export const ONE_DAY = 86400000;

export const setLocalStorage = (key: string, value: any, ttlInMs?: number) => {
  const namespacedKey = getKey(key);
  const now = new Date();
  const item = {
    value,
    ...(ttlInMs !== undefined && { expiry: now.getTime() + ttlInMs }),
  };
  localStorage.setItem(namespacedKey, JSON.stringify(item));
};

export const getLocalStorage = (key: string) => {
  const namespacedKey = getKey(key);
  const itemStr = localStorage.getItem(namespacedKey);
  if (!itemStr) {
    return null;
  }
  const item = JSON.parse(itemStr);
  const now = new Date();
  if (item.expiry !== undefined && now.getTime() > item.expiry) {
    localStorage.removeItem(namespacedKey);
    return null;
  }
  return item.value;
};
