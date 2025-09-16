package br.ucs.webalgo.middleware.adapter.out.integration.solution.mapper;

import br.ucs.webalgo.middleware.adapter.out.integration.solution.dto.LegacyCreateSolutionResponse;
import br.ucs.webalgo.middleware.adapter.out.integration.solution.dto.LegacySaveSolutionResponse;
import br.ucs.webalgo.middleware.adapter.out.integration.solution.dto.LegacySolutionDataResponse;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.CreateSolutionResult;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.FetchSolutionResult;
import br.ucs.webalgo.middleware.application.port.in.solution.dto.SaveSolutionResult;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LegacySolutionMapper {

    public FetchSolutionResult toResult(LegacySolutionDataResponse response) {
        LegacySolutionDataResponse.LegacySolutionInner inner = response != null ? response.resposta() : null;
        if (inner == null) return new FetchSolutionResult(null, null, null);

        List<FetchSolutionResult.SolutionIO> ioList = null;
        if (inner.io() != null) {
            ioList = inner.io().stream()
                    .map(x -> new FetchSolutionResult.SolutionIO(x.ent(), x.sai()))
                    .toList();
        }

        return new FetchSolutionResult(inner.custo(), inner.algo(), ioList);
    }

    public CreateSolutionResult toResult(LegacyCreateSolutionResponse response, String problemCode) {
        return new CreateSolutionResult(response.resposta() + "_" + problemCode);
    }

    public SaveSolutionResult toResult(LegacySaveSolutionResponse response) {
        String status = response == null || response.resposta() == null ? "erro" : response.resposta();
        return new SaveSolutionResult(status);
    }
}
