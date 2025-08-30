package br.ucs.webalgo.middleware.application.port.in.auth.dto;

public record ChangePasswordCommand(String username, String currentPassword, String newPassword, String confirmPassword) {
}
