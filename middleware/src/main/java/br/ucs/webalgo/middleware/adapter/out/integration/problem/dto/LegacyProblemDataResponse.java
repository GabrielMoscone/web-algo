package br.ucs.webalgo.middleware.adapter.out.integration.problem.dto;

import java.util.List;

public record LegacyProblemDataResponse(LegacyProblemDataInner respostas) {

    public record LegacyProblemDataInner(
            String sai,
            Integer custo,
            List<String> melhor,
            String ent,
            List<String> sols,
            String desc) {
    }
}