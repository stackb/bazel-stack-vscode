import * as grpc from '@grpc/grpc-js';
import { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import { CustomersClient as _build_stack_nucleate_v1beta_CustomersClient } from './build/stack/nucleate/v1beta/Customers';
import { PlansClient as _build_stack_nucleate_v1beta_PlansClient } from './build/stack/nucleate/v1beta/Plans';
import { SubscriptionsClient as _build_stack_nucleate_v1beta_SubscriptionsClient } from './build/stack/nucleate/v1beta/Subscriptions';

type ConstructorArguments<Constructor> = Constructor extends new (...args: infer Args) => any ? Args: never;
type SubtypeConstructor<Constructor, Subtype> = {
  new(...args: ConstructorArguments<Constructor>): Subtype;
}

export interface ProtoGrpcType {
  build: {
    stack: {
      nucleate: {
        v1beta: {
          CancelSubscriptionRequest: MessageTypeDefinition
          CancelSubscriptionResponse: MessageTypeDefinition
          CreateSubscriptionRequest: MessageTypeDefinition
          Customer: MessageTypeDefinition
          Customers: SubtypeConstructor<typeof grpc.Client, _build_stack_nucleate_v1beta_CustomersClient> & { service: ServiceDefinition }
          GetCustomerRequest: MessageTypeDefinition
          ListPlansRequest: MessageTypeDefinition
          ListPlansResponse: MessageTypeDefinition
          PaymentSource: MessageTypeDefinition
          Plan: MessageTypeDefinition
          Plans: SubtypeConstructor<typeof grpc.Client, _build_stack_nucleate_v1beta_PlansClient> & { service: ServiceDefinition }
          Subscription: MessageTypeDefinition
          Subscriptions: SubtypeConstructor<typeof grpc.Client, _build_stack_nucleate_v1beta_SubscriptionsClient> & { service: ServiceDefinition }
        }
      }
    }
  }
}

