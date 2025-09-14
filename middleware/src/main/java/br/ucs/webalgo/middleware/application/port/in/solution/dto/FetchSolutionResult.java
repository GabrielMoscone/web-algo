package br.ucs.webalgo.middleware.application.port.in.solution.dto;

import java.util.List;

public record FetchSolutionResult(Integer cost,
                                  String solution,
                                  List<SolutionIO> ioList) {

    public record SolutionIO(String input, String output) {
    }
}