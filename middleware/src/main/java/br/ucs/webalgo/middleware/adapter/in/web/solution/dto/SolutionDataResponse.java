package br.ucs.webalgo.middleware.adapter.in.web.solution.dto;

import java.util.List;

public record SolutionDataResponse(
        Integer cost,
        String solution,
        List<SolutionIO> IOList) {

    public record SolutionIO(String input, String output) {
    }
}