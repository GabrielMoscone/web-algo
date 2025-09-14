package br.ucs.webalgo.middleware.application.port.in.problem.dto;

import java.util.List;

public record FetchByCodeResult(
        String input,
        String output,
        Integer cost,
        List<String> solutions,
        List<String> ranking,
        String description
) {
}