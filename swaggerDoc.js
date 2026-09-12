const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Event Management API",
      version: "1.0.0",
      description: "API Documentation for Event Management Project"
    },

    servers: [
      {
        url: "http://localhost:5000"
      }
    ],

   components: {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT"
    }
  },

  schemas: {
    RegisterRequest: {
      type: "object",
      required: ["name", "email", "password"],
      properties: {
        name: {
          type: "string",
          example: "Amira"
        },
        email: {
          type: "string",
          format: "email",
          example: "amira@gmail.com"
        },
        password: {
          type: "string",
          format: "password",
          example: "123456"
        },
        role: {
          type: "string",
          enum: ["organizer", "attendee"],
          example: "attendee"
        }
      }
    },

    LoginRequest: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: {
          type: "string",
          format: "email",
          example: "amira@gmail.com"
        },
        password: {
          type: "string",
          format: "password",
          example: "123456"
        }
      }
    },

    User: {
      type: "object",
      properties: {
        id: {
          type: "string",
          example: "64abc123456789"
        },
        name: {
          type: "string",
          example: "Amira"
        },
        email: {
          type: "string",
          example: "amira@gmail.com"
        },
        role: {
          type: "string",
          enum: ["organizer", "attendee"],
          example: "attendee"
        }
      }
    },

    AuthResponse: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          example: true
        },
        data: {
          type: "object",
          properties: {
            user: {
              $ref: "#/components/schemas/User"
            },
            token: {
              type: "string",
              example: "jwt-token"
            }
          }
        }
      }
    },

    CreateEventRequest: {
      type: "object",
      required: [
        "title",
        "description",
        "location",
        "date",
        "capacity"
      ],
      properties: {
        title: {
          type: "string",
          example: "Tech Conference"
        },
        description: {
          type: "string",
          example: "Technology event"
        },
        location: {
          type: "string",
          example: "Cairo"
        },
        date: {
          type: "string",
          format: "date-time",
          example: "2026-12-20T10:00:00Z"
        },
        capacity: {
          type: "integer",
          minimum: 1,
          example: 100
        }
      }
    },

    UpdateEventRequest: {
      type: "object",
      properties: {
        title: {
          type: "string",
          example: "Updated Event"
        },
        description: {
          type: "string",
          example: "Updated description"
        },
        location: {
          type: "string",
          example: "Giza"
        },
        date: {
          type: "string",
          format: "date-time",
          example: "2026-12-25T10:00:00Z"
        },
        capacity: {
          type: "integer",
          minimum: 1,
          example: 150
        },
        status: {
          type: "string",
          enum: [
            "upcoming",
            "ongoing",
            "completed",
            "cancelled"
          ],
          example: "upcoming"
        }
      }
    },

    Event: {
      type: "object",
      properties: {
        _id: {
          type: "string",
          example: "64abc123456789"
        },
        title: {
          type: "string",
          example: "Tech Conference"
        },
        description: {
          type: "string",
          example: "Technology event"
        },
        location: {
          type: "string",
          example: "Cairo"
        },
        date: {
          type: "string",
          format: "date-time"
        },
        capacity: {
          type: "integer",
          example: 100
        },
        availableSeats: {
          type: "integer",
          example: 80
        },
        organizer: {
          type: "string",
          example: "64abc123456789"
        },
        status: {
          type: "string",
          enum: [
            "upcoming",
            "ongoing",
            "completed",
            "cancelled"
          ],
          example: "upcoming"
        }
      }
    },
SummarizeEventRequest: {
  type: "object",
  required: ["title", "description"],
  properties: {
    title: {
      type: "string",
      example: "Technology Conference"
    },
    description: {
      type: "string",
      example: "A conference about modern web development and AI."
    }
  }
},

SummarizeEventResponse: {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: true
    },
    summary: {
      type: "string",
      example: "A technology conference focused on web development and AI."
    }
  }
},
    
CreateReservationRequest: {
  type: "object",
  required: ["eventId", "ticketQuantity"],
  properties: {
    eventId: {
      type: "string",
      example: "64abc123456789"
    },
    ticketQuantity: {
      type: "integer",
      minimum: 1,
      example: 2
    }
  }
},

Reservation: {
  type: "object",
  properties: {
    _id: {
      type: "string",
      example: "64abc987654321"
    },
    user: {
      type: "string",
      example: "64abc123456789"
    },
    event: {
      type: "string",
      example: "64abc456789123"
    },
    ticketQuantity: {
      type: "integer",
      example: 2
    },
    status: {
      type: "string",
      enum: ["active", "cancelled"],
      example: "active"
    }
  }
},

ReservationResponse: {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      example: true
    },
    msg: {
      type: "string",
      example: "Reservation created successfully"
    },
    reservation: {
      $ref: "#/components/schemas/Reservation"
    }
  }
},

    ErrorResponse: {
      type: "object",
      properties: {
        success: {
          type: "boolean",
          example: false
        },
        message: {
          type: "string",
          example: "Something went wrong"
        },
        error: {
          type: "string",
          example: "Validation error"
        }
      }
    }
  }
   }},

  apis: ["./routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;