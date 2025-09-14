package br.ucs.webalgo.middleware.adapter.out.integration.solution.mapper;

import br.ucs.webalgo.middleware.adapter.out.integration.solution.dto.LegacySolutionDataResponse;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionResult;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LegacySolutionMapper {

    public FetchSolutionResult toResult(LegacySolutionDataResponse src) {
        LegacySolutionDataResponse.LegacySolutionInner inner = src != null ? src.resposta() : null;
        if (inner == null) return new FetchSolutionResult(null, null, null);

        List<FetchSolutionResult.SolutionIO> ioList = null;
        if (inner.io() != null) {
            ioList = inner.io().stream()
                    .map(x -> new FetchSolutionResult.SolutionIO(x.ent(), x.sai()))
                    .toList();
        }

        return new FetchSolutionResult(inner.custo(), inner.algo(), ioList);
    }
}
