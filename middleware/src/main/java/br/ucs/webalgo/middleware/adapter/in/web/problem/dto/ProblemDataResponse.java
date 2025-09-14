package br.ucs.webalgo.middleware.adapter.in.web.problem.dto;

import java.util.List;

public record ProblemDataResponse(
        String input,
        String output,
        Integer cost,
        List<String> solutions,
        List<String> ranking,
        String description) {
}