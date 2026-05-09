import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export async function saveSession(params: {
    access: string;
    refresh: string;
    user: unknown;
}) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, params.access);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, params.refresh);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(params.user));
}

export async function getSession() {
    const access = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refresh = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    const userString = await SecureStore.getItemAsync(USER_KEY);

    if (!access || !refresh || !userString) {
        return null;
    }

    return {
        access,
        refresh,
        user: JSON.parse(userString),
    };
}

export async function clearSession() {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
}