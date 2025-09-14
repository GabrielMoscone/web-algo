package br.ucs.webalgo.middleware.adapter.out.integration.solution.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LegacySolutionDataResponse(LegacySolutionInner resposta) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LegacySolutionInner(Integer custo, String algo, List<LegacySolutionIO> io) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LegacySolutionIO(String ent, String sai) {
    }
}

