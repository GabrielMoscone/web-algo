package br.ucs.webalgo.middleware.application.port.in.problem.dto;

public record FetchByCodeCommand(String code, String sessionId, String username) {}
