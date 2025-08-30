package br.ucs.webalgo.middleware.shared.util;

public final class CookieUtils {
    private CookieUtils() {
    }

    public static String extractCookieValue(String setCookie, String name) {
        if (setCookie == null || name == null) return null;
        int i = setCookie.indexOf(name + "=");
        if (i < 0) return null;
        int start = i + name.length() + 1;
        int end = setCookie.indexOf(';', start);
        return end > 0 ? setCookie.substring(start, end) : setCookie.substring(start);
    }
}
