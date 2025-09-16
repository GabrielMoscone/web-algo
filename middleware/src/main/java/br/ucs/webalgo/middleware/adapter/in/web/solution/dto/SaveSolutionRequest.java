package br.ucs.webalgo.middleware.adapter.in.web.solution.dto;

public record SaveSolutionRequest(String algorithm, String problemCode, Integer cost, String answer) {
}