package br.ucs.webalgo.middleware.application.port.in.problem.dto;

import java.util.List;

public record FetchByCodeResult(
        String ent,
        String sai,
        Integer custo,
        List<String> sols,
        List<String> melhor,
        String desc
) {
}