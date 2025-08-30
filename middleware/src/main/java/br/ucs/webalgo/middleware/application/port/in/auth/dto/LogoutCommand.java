package br.ucs.webalgo.middleware.application.port.in.auth.dto;

public record LogoutCommand(String username, String sessionId) {
}
