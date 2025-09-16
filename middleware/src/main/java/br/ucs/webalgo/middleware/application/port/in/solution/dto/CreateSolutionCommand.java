package br.ucs.webalgo.middleware.application.port.in.solution.dto;

public record CreateSolutionCommand(String problemCode, String sessionId, String username) {
}
