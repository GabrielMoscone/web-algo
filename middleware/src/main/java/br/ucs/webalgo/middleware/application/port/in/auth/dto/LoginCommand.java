package br.ucs.webalgo.middleware.application.port.in.auth.dto;

public record LoginCommand(String username, String password) {
}