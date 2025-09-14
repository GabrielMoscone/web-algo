package br.ucs.webalgo.middleware.adapter.out.integration.problem.mapper;

import br.ucs.webalgo.middleware.adapter.out.integration.problem.dto.LegacyProblemDataResponse;
import br.ucs.webalgo.middleware.adapter.out.integration.problem.dto.LegacySearchByKeyResponse;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.FetchByCodeResult;
import br.ucs.webalgo.middleware.application.port.in.problem.dto.SearchByKeyResult;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LegacyProblemMapper {

    public SearchByKeyResult toResult(LegacySearchByKeyResponse legacy) {
        List<String> codes =
                legacy.probs() == null ? List.of()
                        : legacy.probs().stream()
                        .flatMap(list -> list.stream().findFirst().stream())
                        .toList();

        return new SearchByKeyResult(codes);
    }

    public FetchByCodeResult toResult(LegacyProblemDataResponse res, String code) {
        LegacyProblemDataResponse.LegacyProblemDataInner result = res.respostas();

        List<String> solutions = result.sols().stream().map(el -> el + "_" + code).toList();
        return new FetchByCodeResult(result.ent(), result.sai(), result.custo(), solutions, result.melhor(), result.desc());
    }
}