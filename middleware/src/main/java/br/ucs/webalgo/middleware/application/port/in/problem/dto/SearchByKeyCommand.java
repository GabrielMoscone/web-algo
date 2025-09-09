package br.ucs.webalgo.middleware.application.port.in.problem.dto;

public record SearchByKeyCommand (String key, String sessionId, String username) {
}
