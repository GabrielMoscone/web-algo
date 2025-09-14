package br.ucs.webalgo.middleware.application.port.in.solution.dto;

public record FetchSolutionCommand(String code, String sessionId, String username) {
}