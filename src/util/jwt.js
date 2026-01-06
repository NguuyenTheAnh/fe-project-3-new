import { jwtDecode } from "jwt-decode";

export function parseJwt(accessToken) {
  if (!accessToken) return null;
  try {
    const payload = jwtDecode(accessToken);
    const { sub, email, roles = [], exp } = payload || {};
    return { sub, email, roles, exp };
  } catch (error) {
    return null;
  }
}

export function hasRole(user, roleName) {
  if (!user?.roles) return false;
  return user.roles.includes(roleName);
}

export function isTokenExpired(accessToken) {
  const parsed = parseJwt(accessToken);
  if (!parsed?.exp) return false;
  return parsed.exp * 1000 < Date.now();
}
