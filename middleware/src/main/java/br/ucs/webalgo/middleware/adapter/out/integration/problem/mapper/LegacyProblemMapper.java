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

    public FetchByCodeResult toResult(LegacyProblemDataResponse res) {
        var r = res.respostas();
        return new FetchByCodeResult(r.ent(), r.sai(), r.custo(), r.sols(), r.melhor(), r.desc());
    }
}