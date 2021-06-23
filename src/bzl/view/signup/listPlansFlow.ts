import * as grpc from '@grpc/grpc-js';
import { ListPlansResponse } from '../../../proto/build/stack/nucleate/v1beta/ListPlansResponse';
import { Plan } from '../../../proto/build/stack/nucleate/v1beta/Plan';
import { PlansClient } from '../../../proto/build/stack/nucleate/v1beta/Plans';
import { GRPCResponseFlow } from './grpcResponseFlow';

export class ListPlansFlow extends GRPCResponseFlow<ListPlansResponse> {
  constructor(
    protected plansClient: PlansClient,
    protected bearerToken: string,
    protected successFlow: (plans: Plan[]) => Promise<void>
  ) {
    super('plans', bearerToken);
  }

  async handleResponse(response: ListPlansResponse): Promise<ListPlansResponse> {
    await this.successFlow(response.plan!);
    return response;
  }

  getInternal(): Promise<{
    response: ListPlansResponse | undefined;
    error: grpc.ServiceError | undefined;
  }> {
    return new Promise((resolve, _) => {
      this.plansClient.List(
        {},
        this.getGrpcMetadata(),
        (err?: grpc.ServiceError, resp?: ListPlansResponse) => {
          resolve({
            response: resp,
            error: err,
          });
        }
      );
    });
  }
}
