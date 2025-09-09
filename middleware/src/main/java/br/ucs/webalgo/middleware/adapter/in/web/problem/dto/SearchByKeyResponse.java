package br.ucs.webalgo.middleware.adapter.in.web.problem.dto;

import java.util.List;

public record SearchByKeyResponse(List<String> codes, String message) {
}

