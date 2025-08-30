package br.ucs.webalgo.middleware.application.port.in.auth.dto;

public record LoginResult(String sessionId, String username, String rawSetCookie) {
}
