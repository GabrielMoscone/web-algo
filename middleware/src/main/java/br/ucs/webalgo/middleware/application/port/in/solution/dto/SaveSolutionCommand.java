package br.ucs.webalgo.middleware.application.port.in.solution.dto;


public record SaveSolutionCommand(String algorithm, String problemCode, int cost, String answer, String sessionId,
                                  String username) {
}