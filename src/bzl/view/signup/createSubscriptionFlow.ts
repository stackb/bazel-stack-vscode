import * as grpc from '@grpc/grpc-js';
import { CreateSubscriptionRequest } from '../../../proto/build/stack/nucleate/v1beta/CreateSubscriptionRequest';
import { Subscription } from '../../../proto/build/stack/nucleate/v1beta/Subscription';
import { SubscriptionsClient } from '../../../proto/build/stack/nucleate/v1beta/Subscriptions';
import { GRPCResponseFlow } from './grpcResponseFlow';

export class CreateSubscriptionFlow extends GRPCResponseFlow<Subscription> {
  constructor(
    protected subscriptionsClient: SubscriptionsClient,
    protected bearerToken: string,
    protected request: CreateSubscriptionRequest,
    protected alreadyExistsFlow: (err: grpc.ServiceError) => Promise<void>,
    protected successFlow: (subscription: Subscription) => Promise<void>
  ) {
    super('create-subscription', bearerToken);
  }

  async handleResponse(response: Subscription): Promise<Subscription> {
    await this.successFlow(response);
    return response;
  }

  async handleServiceError(status: grpc.ServiceError): Promise<void> {
    if (status.code === grpc.status.ALREADY_EXISTS) {
      return this.alreadyExistsFlow(status);
    }
    super.handleServiceError(status);
  }

  getInternal(): Promise<{
    response: Subscription | undefined;
    error: grpc.ServiceError | undefined;
  }> {
    return new Promise((resolve, _) => {
      this.subscriptionsClient.CreateSubscription(
        this.request,
        this.getGrpcMetadata(),
        (err?: grpc.ServiceError, resp?: Subscription) => {
          resolve({
            response: resp,
            error: err,
          });
        }
      );
    });
  }
}
